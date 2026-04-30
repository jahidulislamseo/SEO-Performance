import paramiko

def debug_vps():
    ip = '134.209.219.70'
    user = 'root'
    pw = 'JahiDul90@jf'
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(ip, username=user, password=pw)
    
    # Check port 5000 and 80
    stdin, stdout, stderr = client.exec_command("netstat -tuln | grep -E '5000|80'")
    print("Ports Listening:")
    print(stdout.read().decode())
    
    # Check Gunicorn logs
    stdin, stdout, stderr = client.exec_command("journalctl -u seo-dashboard -n 20")
    print("\nLogs:")
    print(stdout.read().decode())
    
    client.close()

if __name__ == "__main__":
    debug_vps()
