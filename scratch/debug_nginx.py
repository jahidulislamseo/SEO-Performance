import paramiko

def debug_nginx():
    ip = '134.209.219.70'
    user = 'root'
    pw = 'JahiDul90@jf'
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(ip, username=user, password=pw)
    
    # Check if nginx is running
    stdin, stdout, stderr = client.exec_command("systemctl status nginx")
    print("Nginx Status:")
    print(stdout.read().decode())
    
    # Check if nginx config is ok
    stdin, stdout, stderr = client.exec_command("nginx -t")
    print("\nNginx Config Test:")
    print(stderr.read().decode()) # nginx -t output goes to stderr
    
    # Start nginx if stopped
    client.exec_command("systemctl start nginx")
    
    client.close()

if __name__ == "__main__":
    debug_nginx()
