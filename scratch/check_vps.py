import paramiko

def check_server():
    try:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect('134.209.219.70', username='root', password='JahiDul90@jf')
        
        stdin, stdout, stderr = client.exec_command('uname -a; uptime; which docker; which nginx; which node')
        print(stdout.read().decode())
        
        client.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_server()
