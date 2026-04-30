import paramiko
import time
import os

HOST = '165.22.188.160'
USER = 'root'
PASS = 'JahiDul90@jf'
REPO_URL = 'https://github.com/jahidulislamseo/SEO-Performance.git'
PROJECT_DIR = '/var/www/seo-performance'

def run_cmd(ssh, cmd):
    print(f"Executing: {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    
    # Read output as it comes
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8')
    err = stderr.read().decode('utf-8')
    
    if out: print(out.encode('cp1252', errors='replace').decode('cp1252'))
    if err and exit_status != 0: print(f"ERROR: {err}".encode('cp1252', errors='replace').decode('cp1252'))
    return exit_status

def deploy():
    print("Connecting to VPS...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASS, timeout=30)
    
    print("\n--- 1. Server Provisioning ---")
    run_cmd(ssh, "apt update -y")
    run_cmd(ssh, "apt install -y curl git python3 python3-pip python3-venv nginx")
    
    # Install Node.js v20
    run_cmd(ssh, "curl -fsSL https://deb.nodesource.com/setup_20.x | bash -")
    run_cmd(ssh, "apt install -y nodejs")
    
    print("\n--- 2. Cloning Repository ---")
    run_cmd(ssh, f"mkdir -p /var/www")
    # If exists, remove it for fresh clone or pull. We'll remove for fresh clone here.
    run_cmd(ssh, f"rm -rf {PROJECT_DIR}")
    run_cmd(ssh, f"git clone {REPO_URL} {PROJECT_DIR}")
    
    print("\n--- 3. Transferring Secrets ---")
    sftp = ssh.open_sftp()
    
    local_env = os.path.join("api", ".env")
    if os.path.exists(local_env):
        print("Uploading .env...")
        sftp.put(local_env, f"{PROJECT_DIR}/api/.env")
    else:
        print("WARNING: local api/.env not found!")

    local_creds = os.path.join("api", "creds.json")
    if os.path.exists(local_creds):
        print("Uploading creds.json...")
        sftp.put(local_creds, f"{PROJECT_DIR}/api/creds.json")
    else:
        print("WARNING: local api/creds.json not found!")
    
    sftp.close()

    print("\n--- 4. Backend Setup ---")
    run_cmd(ssh, f"cd {PROJECT_DIR}/api && python3 -m venv venv")
    run_cmd(ssh, f"cd {PROJECT_DIR}/api && ./venv/bin/pip install -r requirements.txt")
    run_cmd(ssh, f"cd {PROJECT_DIR}/api && ./venv/bin/pip install gunicorn")
    
    # Create systemd service for Flask
    service_content = f"""[Unit]
Description=Gunicorn instance to serve SEO Dashboard API
After=network.target

[Service]
User=root
Group=www-data
WorkingDirectory={PROJECT_DIR}/api
Environment="PATH={PROJECT_DIR}/api/venv/bin"
ExecStart={PROJECT_DIR}/api/venv/bin/gunicorn --workers 3 --bind 127.0.0.1:5000 index:app

[Install]
WantedBy=multi-user.target
"""
    run_cmd(ssh, f"cat << 'EOF' > /etc/systemd/system/seo-api.service\n{service_content}\nEOF")
    run_cmd(ssh, "systemctl daemon-reload")
    run_cmd(ssh, "systemctl start seo-api")
    run_cmd(ssh, "systemctl enable seo-api")
    
    print("\n--- 5. Frontend Setup ---")
    # Replace localhost:5000 with relative /api proxy in the frontend if needed? 
    # Actually, Vercel frontend relies on Vite proxy which doesn't work in build.
    # In Nginx, we will proxy /api to 5000, so fetch('/api/...') will work perfectly!
    run_cmd(ssh, f"cd {PROJECT_DIR}/frontend && npm install")
    run_cmd(ssh, f"cd {PROJECT_DIR}/frontend && npm run build")
    
    print("\n--- 6. Nginx Setup ---")
    nginx_conf = f"""server {{
    listen 80;
    server_name _;

    root {PROJECT_DIR}/frontend/dist;
    index index.html;

    location / {{
        try_files $uri $uri/ /index.html;
    }}

    location /api/ {{
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }}
}}
"""
    run_cmd(ssh, f"cat << 'EOF' > /etc/nginx/sites-available/seo-dashboard\n{nginx_conf}\nEOF")
    run_cmd(ssh, "ln -sf /etc/nginx/sites-available/seo-dashboard /etc/nginx/sites-enabled/")
    run_cmd(ssh, "rm -f /etc/nginx/sites-enabled/default")
    run_cmd(ssh, "systemctl restart nginx")

    print("\n--- Deployment Complete! ---")
    ssh.close()

if __name__ == '__main__':
    deploy()
