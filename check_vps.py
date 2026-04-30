import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('165.22.188.160', username='root', password='JahiDul90@jf')
stdin, stdout, stderr = ssh.exec_command('ps aux | grep -E "nginx|gunicorn|node|npm"')
print("Running processes:", stdout.read().decode())
stdin, stdout, stderr = ssh.exec_command('ls -l /var/www/seo-performance/frontend/dist')
print("Dist directory:", stdout.read().decode())
ssh.close()
