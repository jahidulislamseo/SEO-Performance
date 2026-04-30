import paramiko
import os
import tarfile
import subprocess
import time

def deploy():
    # VPS Credentials
    ip = '159.223.41.11'
    user = 'root'
    pw = 'JahiDul90@jf'
    remote_path = '/var/www/seo-performance'

    # Environment Variables (from api/.env)
    sheet_id = '1jClQQmwVHg4Eg3WGda0R3w7_B_qwuRE5_W4QGxvabIE'
    mongo_uri = 'mongodb+srv://seo-data:seo-data@seo-data.s5zj7yf.mongodb.net/?appName=seo-data'

    # 1. Build frontend locally
    print("--- Step 1: Building frontend locally ---")
    frontend_dir = os.path.join(os.getcwd(), "..", "frontend")
    try:
        subprocess.run("npm install", cwd=frontend_dir, shell=True, check=True)
        subprocess.run("npm run build", cwd=frontend_dir, shell=True, check=True)
    except subprocess.CalledProcessError as e:
        print(f"Error during frontend build: {e}")
        return

    # 2. Compress files
    print("\n--- Step 2: Compressing files ---")
    api_dir = os.path.join(os.getcwd(), "..", "api")
    dist_dir = os.path.join(os.getcwd(), "..", "frontend", "dist")
    
    with tarfile.open("deploy.tar.gz", "w:gz") as tar:
        if os.path.exists(api_dir):
            tar.add(api_dir, arcname="api")
        if os.path.exists(dist_dir):
            tar.add(dist_dir, arcname="frontend/dist")
    print("Archive created: deploy.tar.gz")

    # 3. Connect and Upload
    print("\n--- Step 3: Connecting to VPS and Uploading ---")
    try:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(ip, username=user, password=pw)
        
        def run(cmd):
            print(f"Executing: {cmd}")
            stdin, stdout, stderr = client.exec_command(cmd)
            out = stdout.read().decode('utf-8', errors='ignore')
            err = stderr.read().decode('utf-8', errors='ignore')
            try:
                if out: print(out)
                if err: print(f"Error: {err}")
            except UnicodeEncodeError:
                print("[Output contains characters that cannot be printed in this console]")
            return out, err

        # Upload archive
        sftp = client.open_sftp()
        print("Uploading deploy.tar.gz...")
        sftp.put("deploy.tar.gz", f"/root/deploy.tar.gz")
        sftp.close()

        # 4. Prepare server
        print("\n--- Step 4: Preparing server ---")
        run("apt update && apt install -y nginx python3-pip python3-venv ufw")
        
        # Setup Swap (1GB) if not exists
        run("if [ ! -f /swapfile ]; then fallocate -l 1G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile && echo '/swapfile none swap sw 0 0' >> /etc/fstab; fi")
        
        # Setup Firewall
        run("ufw allow 80/tcp && ufw allow 443/tcp && ufw allow 22/tcp && ufw --force enable")
        
        # Extract files
        run(f"mkdir -p {remote_path}")
        run(f"tar -xzf /root/deploy.tar.gz -C {remote_path} && rm /root/deploy.tar.gz")

        # 5. Setup API
        print("\n--- Step 5: Setting up Python Environment ---")
        run(f"cd {remote_path}/api && python3 -m venv venv && ./venv/bin/pip install -r requirements.txt gunicorn flask-cors")

        # 6. Create Gunicorn Service
        print("\n--- Step 6: Creating Gunicorn Service ---")
        service_content = f"""[Unit]
Description=Gunicorn instance to serve SEO Dashboard API
After=network.target

[Service]
User=root
Group=www-data
WorkingDirectory={remote_path}/api
Environment="PATH={remote_path}/api/venv/bin"
Environment="SHEET_ID={sheet_id}"
Environment="MONGO_URI={mongo_uri}"
ExecStart={remote_path}/api/venv/bin/gunicorn --workers 1 --bind 127.0.0.1:5000 index:app

[Install]
WantedBy=multi-user.target
"""
        # Create temporary service file locally and upload
        with open("seo-dashboard.service", "w") as f:
            f.write(service_content)
        
        sftp = client.open_sftp()
        sftp.put("seo-dashboard.service", "/etc/systemd/system/seo-dashboard.service")
        sftp.close()
        os.remove("seo-dashboard.service")

        run("systemctl daemon-reload && systemctl enable seo-dashboard && systemctl restart seo-dashboard")

        # 7. Configure Nginx
        print("\n--- Step 7: Configuring Nginx ---")
        nginx_conf = f"""server {{
    listen 80;
    server_name {ip};

    location / {{
        root {remote_path}/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }}

    location /api {{
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }}
}}
"""
        with open("seo-dashboard-nginx", "w") as f:
            f.write(nginx_conf)
        
        sftp = client.open_sftp()
        sftp.put("seo-dashboard-nginx", "/etc/nginx/sites-available/seo-dashboard")
        sftp.close()
        os.remove("seo-dashboard-nginx")

        run("ln -sf /etc/nginx/sites-available/seo-dashboard /etc/nginx/sites-enabled/")
        run("rm -f /etc/nginx/sites-enabled/default")
        run("nginx -t && systemctl restart nginx")

        print("\n--- Deployment Finished! ---")
        print(f"App available at: http://{ip}")

        client.close()
    except Exception as e:
        print(f"Error during deployment: {e}")

if __name__ == "__main__":
    deploy()
