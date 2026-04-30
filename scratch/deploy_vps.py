import paramiko
import os
import tarfile

def deploy():
    ip = '134.209.219.70'
    user = 'root'
    pw = 'JahiDul90@jf'
    remote_path = '/var/www/seo-performance'

    # 0. Build frontend locally
    print("Building frontend locally...")
    os.system("cd frontend && npm install && npm run build")
    
    print("Connecting to VPS...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(ip, username=user, password=pw)
    
    def run(cmd):
        print(f"Running: {cmd}")
        stdin, stdout, stderr = client.exec_command(cmd)
        out = stdout.read().decode('utf-8', errors='ignore')
        err = stderr.read().decode('utf-8', errors='ignore')
        try:
            if out: print(out)
            if err: print(f"Error: {err}")
        except UnicodeEncodeError:
            print("[Output contains characters that cannot be printed in this console]")
        return out, err

    # 1. Install dependencies & Setup Swap (for low RAM)
    run("apt update && apt install -y nginx python3-pip python3-venv ufw")
    run("if [ ! -f /swapfile ]; then fallocate -l 1G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile && echo '/swapfile none swap sw 0 0' >> /etc/fstab; fi")
    run("ufw allow 80/tcp && ufw allow 65002/tcp && ufw --force enable")
    
    # 2. Prepare directory
    run(f"mkdir -p {remote_path}/api")
    
    # 3. Compress and Upload files
    print("Compressing files...")
    with tarfile.open("deploy.tar.gz", "w:gz") as tar:
        tar.add("api", arcname="api")
        tar.add("frontend/dist", arcname="frontend/dist")
    
    print("Uploading archive...")
    sftp = client.open_sftp()
    sftp.put("deploy.tar.gz", f"{remote_path}/deploy.tar.gz")
    
    # 4. Extract on server
    run(f"cd {remote_path} && tar -xzf deploy.tar.gz && rm deploy.tar.gz")
    
    # 5. Setup Python Venv and Install requirements
    run(f"cd {remote_path}/api && python3 -m venv venv && ./venv/bin/pip install -r requirements.txt gunicorn flask-cors")
    
    # 6. Create Systemd Service for Gunicorn (Reduced workers for 512MB RAM)
    service_content = f"""[Unit]
Description=Gunicorn instance to serve SEO Dashboard API
After=network.target

[Service]
User=root
Group=www-data
WorkingDirectory={remote_path}/api
Environment="PATH={remote_path}/api/venv/bin"
Environment="SHEET_ID=1jClQQmwVHg4Eg3WGda0R3w7_B_qwuRE5_W4QGxvabIE"
Environment="MONGO_URI=mongodb+srv://seo-data:seo-data@seo-data.s5zj7yf.mongodb.net/?appName=seo-data"
ExecStart={remote_path}/api/venv/bin/gunicorn --workers 1 --bind 0.0.0.0:5000 index:app

[Install]
WantedBy=multi-user.target
"""
    run(f"echo '{service_content}' > /etc/systemd/system/seo-dashboard.service")
    run("systemctl daemon-reload && systemctl enable seo-dashboard && systemctl restart seo-dashboard")
    
    # 7. Configure Nginx
    nginx_conf = f"""server {{
    listen 80;
    server_name 134.209.219.70;

    location / {{
        root {remote_path}/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }}

    location /api {{
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }}
}}
"""
    run(f"echo '{nginx_conf}' > /etc/nginx/sites-available/seo-dashboard")
    run("ln -sf /etc/nginx/sites-available/seo-dashboard /etc/nginx/sites-enabled/")
    run("rm -f /etc/nginx/sites-enabled/default")
    run("nginx -t && systemctl restart nginx")
    
    print("Deployment complete!")
    client.close()

if __name__ == "__main__":
    deploy()
