import paramiko

def check_health():
    ip = '134.209.219.70'
    user = 'root'
    pw = 'JahiDul90@jf'
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(ip, username=user, password=pw)
    
    stdin, stdout, stderr = client.exec_command("systemctl status seo-dashboard && systemctl status nginx")
    print(stdout.read().decode())
    client.close()

if __name__ == "__main__":
    check_health()
