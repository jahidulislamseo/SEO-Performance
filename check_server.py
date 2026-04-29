import paramiko
import sys

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    client.connect('159.223.41.11', username='root', password='JahiDul90@jf', timeout=10)
    
    commands = [
        "systemctl status nginx --no-pager",
        "pm2 list",
        "docker ps -a",
        "netstat -tulpn | grep -E ':80|:443|:5000'",
        "journalctl -u nginx --no-pager -n 20"
    ]
    
    print("--- Connection Successful ---")
    for cmd in commands:
        print(f"\n>>> Running: {cmd}")
        stdin, stdout, stderr = client.exec_command(cmd)
        print(stdout.read().decode('utf-8'))
        err = stderr.read().decode('utf-8')
        if err:
            print("ERROR:", err)
            
except Exception as e:
    print(f"Failed to connect: {e}")
finally:
    client.close()
