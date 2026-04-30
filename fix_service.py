import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('165.22.188.160', username='root', password='JahiDul90@jf')

service_content = """[Unit]
Description=Gunicorn instance to serve SEO Dashboard API
After=network.target

[Service]
User=root
Group=www-data
WorkingDirectory=/var/www/seo-performance/api
Environment="PATH=/var/www/seo-performance/api/venv/bin"
ExecStart=/var/www/seo-performance/api/venv/bin/gunicorn --workers 3 --bind 0.0.0.0:5000 index:app

[Install]
WantedBy=multi-user.target
"""

sftp = ssh.open_sftp()
with sftp.file('/etc/systemd/system/seo-dashboard.service', 'w') as f:
    f.write(service_content)
sftp.close()

ssh.exec_command('systemctl daemon-reload && systemctl start seo-dashboard && systemctl enable seo-dashboard')
ssh.close()
print("Service seo-dashboard created and started.")
