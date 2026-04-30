import paramiko
import sys

def test_ssh(ip, user, pw):
    try:
        print(f"Connecting to {ip}...")
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(ip, username=user, password=pw, timeout=10)
        
        print("Connected! Running 'uname -a'...")
        stdin, stdout, stderr = client.exec_command("uname -a")
        print(stdout.read().decode())
        
        print("Checking current directory...")
        stdin, stdout, stderr = client.exec_command("ls -la")
        print(stdout.read().decode())
        
        client.close()
        print("Done.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_ssh("159.223.41.11", "root", "JahiDul90@jf")
