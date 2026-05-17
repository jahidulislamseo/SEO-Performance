import paramiko
import time
import os

# Helper to load environment variables from local .env
def load_env(env_path=".env"):
    if not os.path.exists(env_path):
        return
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, val = line.split("=", 1)
            key = key.strip()
            val = val.strip().strip("'").strip('"')
            os.environ[key] = val

# Load local environment variables
load_env()

HOST = os.getenv('VPS_HOST', '165.22.188.160')
USER = os.getenv('VPS_USER', 'root')
PASS = os.getenv('VPS_PASS')
REPO_URL = 'https://github.com/jahidulislamseo/SEO-Performance.git'

# Base directory for the deployment structure
BASE_DIR = '/var/www/seo-performance'
RELEASES_DIR = f"{BASE_DIR}/releases"
SHARED_DIR = f"{BASE_DIR}/shared"
CURRENT_SYM = f"{BASE_DIR}/current"

def run_cmd(ssh, cmd):
    print(f"Executing: {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8')
    err = stderr.read().decode('utf-8')
    
    if out: print(out.encode('cp1252', errors='replace').decode('cp1252'))
    if err and exit_status != 0: print(f"ERROR: {err}".encode('cp1252', errors='replace').decode('cp1252'))
    return exit_status

def deploy():
    if not PASS:
        print("ERROR: VPS_PASS environment variable or value in local .env is missing!")
        return

    print("Connecting to VPS...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASS, timeout=30)
    
    print("\n--- 1. Server Provisioning & Folder Layout ---")
    run_cmd(ssh, "apt update -y")
    run_cmd(ssh, "apt install -y curl git python3 python3-pip python3-venv nginx")
    
    # Install Node.js v20 if not present
    run_cmd(ssh, "which node || (curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt install -y nodejs)")
    
    # Create the folder structure
    run_cmd(ssh, f"mkdir -p {RELEASES_DIR} {SHARED_DIR}")
    
    print("\n--- 2. Transferring Secrets to Shared Directory ---")
    sftp = ssh.open_sftp()
    
    # Upload credentials into the shared folder on VPS
    local_env = os.path.join("api", ".env")
    if os.path.exists(local_env):
        print("Uploading backend .env to shared directory...")
        sftp.put(local_env, f"{SHARED_DIR}/.env")
    else:
        print("WARNING: local api/.env not found!")

    local_creds = os.path.join("api", "creds.json")
    if os.path.exists(local_creds):
        print("Uploading creds.json to shared directory...")
        sftp.put(local_creds, f"{SHARED_DIR}/creds.json")
    else:
        print("WARNING: local api/creds.json not found!")
    
    sftp.close()

    # Generate a unique timestamped release folder name
    release_name = f"release_{int(time.time())}"
    release_path = f"{RELEASES_DIR}/{release_name}"
    
    print(f"\n--- 3. Cloning Repository into New Release ({release_name}) ---")
    run_cmd(ssh, f"git clone {REPO_URL} {release_path}")
    
    print("\n--- 4. Symlinking Secrets into New Release ---")
    run_cmd(ssh, f"ln -sf {SHARED_DIR}/.env {release_path}/api/.env")
    run_cmd(ssh, f"ln -sf {SHARED_DIR}/creds.json {release_path}/api/creds.json")

    print("\n--- 5. Backend Setup in New Release ---")
    run_cmd(ssh, f"cd {release_path}/api && python3 -m venv venv")
    run_cmd(ssh, f"cd {release_path}/api && ./venv/bin/pip install -r requirements.txt")
    run_cmd(ssh, f"cd {release_path}/api && ./venv/bin/pip install gunicorn")
    
    print("\n--- 6. Frontend Setup in New Release ---")
    run_cmd(ssh, f"cd {release_path}/frontend && npm install")
    run_cmd(ssh, f"cd {release_path}/frontend && npm run build")
    
    print("\n--- 7. Atomic Symlink Switch & File Ownership ---")
    # Swapping current symlink atomically to point to new release
    run_cmd(ssh, f"ln -sfn {release_path} {CURRENT_SYM}")
    
    # Assign folder ownership to www-data system user
    run_cmd(ssh, f"chown -R www-data:www-data {BASE_DIR}")
    run_cmd(ssh, f"chmod -R 755 {BASE_DIR}")
    
    print("\n--- 8. Provisioning Hardened systemd Service ---")
    # Gunicorn runs under www-data context now!
    service_content = f"""[Unit]
Description=Gunicorn instance to serve SEO Dashboard API (Hardened)
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory={CURRENT_SYM}/api
Environment="PATH={CURRENT_SYM}/api/venv/bin"
ExecStart={CURRENT_SYM}/api/venv/bin/gunicorn --workers 3 --bind 127.0.0.1:5000 index:app

[Install]
WantedBy=multi-user.target
"""
    # Write systemd file safely using cat EOF
    run_cmd(ssh, f"cat << 'EOF' > /etc/systemd/system/seo-api.service\n{service_content}\nEOF")
    run_cmd(ssh, "systemctl daemon-reload")
    run_cmd(ssh, "systemctl restart seo-api")
    run_cmd(ssh, "systemctl enable seo-api")
    
    print("\n--- 9. Provisioning Nginx Configuration ---")
    # Nginx points to /current symlink distribution folder!
    nginx_conf = f"""server {{
    listen 80;
    server_name _;

    root {CURRENT_SYM}/frontend/dist;
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

    print("\n--- 10. Cleaning Up Older Releases (Keeping Last 3) ---")
    # List by time, keep 3 newest, delete remainder
    cleanup_cmd = f"ls -dt {RELEASES_DIR}/release_* | tail -n +4 | xargs -r rm -rf"
    run_cmd(ssh, cleanup_cmd)

    print("\n--- Zero-Downtime Deployment Complete! ---")
    ssh.close()

if __name__ == '__main__':
    deploy()
