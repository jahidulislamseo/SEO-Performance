import paramiko
import time

def emergency_fix():
    ip = '134.209.219.70'
    user = 'root'
    pw = 'JahiDul90@jf'
    
    print("Connecting to VPS...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(ip, username=user, password=pw, timeout=60)
    print("Connected!")

    def run(cmd):
        stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
        out = stdout.read().decode(errors='replace').strip()
        err = stderr.read().decode(errors='replace').strip()
        if out: print("OUT:", out[:500])
        if err: print("ERR:", err[:200])
        return out

    # Check memory
    run("free -m")
    
    # Check swap
    run("swapon --show")
    
    # Add swap if not exists
    run("if [ ! -f /swapfile ]; then fallocate -l 1G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile; echo 'Swap created'; else echo 'Swap already exists'; fi")
    
    # Show swap after
    run("free -m")
    
    # Upload latest index.py
    print("\nUploading latest api/index.py...")
    sftp = client.open_sftp()
    sftp.put("api/index.py", "/var/www/seo-performance/api/index.py")
    sftp.close()
    print("Uploaded!")
    
    # Restart with 1 worker only
    run("""cat > /etc/systemd/system/seo-dashboard.service << 'EOF'
[Unit]
Description=Gunicorn instance to serve SEO Dashboard API
After=network.target

[Service]
User=root
Group=www-data
WorkingDirectory=/var/www/seo-performance/api
Environment="PATH=/var/www/seo-performance/api/venv/bin"
Environment="SHEET_ID=1jClQQmwVHg4Eg3WGda0R3w7_B_qwuRE5_W4QGxvabIE"
Environment="MONGO_URI=mongodb+srv://seo-data:seo-data@seo-data.s5zj7yf.mongodb.net/?appName=seo-data"
ExecStart=/var/www/seo-performance/api/venv/bin/gunicorn --workers 1 --threads 2 --timeout 120 --bind 0.0.0.0:5000 index:app
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF""")
    
    run("systemctl daemon-reload")
    run("systemctl restart seo-dashboard")
    time.sleep(3)
    run("systemctl status seo-dashboard --no-pager -l | tail -5")
    run("systemctl restart nginx")
    
    print("\nDone! VPS should be back online.")
    client.close()

if __name__ == "__main__":
    emergency_fix()
