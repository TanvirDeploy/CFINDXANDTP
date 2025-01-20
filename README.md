# How To Generate Token Pickle With Android Easily After Google Auth2.0 New policy update and How to create client id, client secret, refresh token for cloudflare . Without any kind of error.

### 1. Install Termux [F-Droid](https://f-droid.org/en/packages/com.termux/)

### 2. Open Termux and just copy paste all the commands that described below, Make sure you have internet connection. if you see Y/n then Type y.

```
apt update && apt upgrade -y && pkg install git -y && pkg install python -y && apt update && pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib && pip install --upgrade pip

```
## 2.1 ```ERROR: Installing pip is forbidden, this will break the python-pip package (termux)```

If you get this error, you need to run the following command:
```
curl -sS https://bootstrap.pypa.io/get-pip.py | python
```
Now run command number 2 again. Hopefully no error will appear.

### 3. you have to give storage permission to termux. for that use this command.

```
termux-setup-storage
```
Note: If the storage command in Termux does not work, you can turn on the permission from the settings on app info.

### 4.

```
cd /sdcard/Tanvir
```
Note: Make sure Save a folder named 'Tanvir' in your phone memory.

### 5.

```
git clone https://github.com/TanvirDeploy/CFINDXANDTP
```
### 6.

```
cd CFINDXANDTP
```

### 7.
Now a folder named CFINDXANDTP has been automatically created inside the Tanvir folder. make sure Credentials.json file present in your phone memory /Tanvir/CFINDXANDTP folder, not in Sd card, if not then just move credentials.json file into the CFINDXANDTP folder . Not use sdcard

### 8.

```
python3 generate_drive_token.py
```

### 9.
You'll find a url https://accounts.google.com/o/oauth2/=offline like this. just copy this url and paste on browser and login into your google account. that's it. you'll see 'The authentication flow has completed. You may close this window' this massage. then you're done.

### 5. you have to give storage permission to termux. for that use this command.

```
termux-setup-storage
```

### 6.

```
cd /sdcard
```

### 7.

```
cp -r credentials.json /data/data/com.termux/files/home/TokenPickle
```

### 8. Just exit from termux and reopen it.

### 9.

```
cd TokenPickle
```

### 10.

```
python3 generate_drive_token.py
```

### 11. You'll find a url https://accounts.google.com/o/oauth2/=offline like this. just copy this url and paste on browser and login into your google account. that's it. you'll see 'The authentication flow has completed. You may close this window' this massage. then you're done.

### 12.

```
cp -r token.pickle /sdcard
```

### 13. Boom 💥!

goto your sdcard (phone memory) you'll find token.pickle there.

We're Done.

# Enjoy And don't forget to star this repo 🙂

# Credits...

[`Anasty17`](https://github.com/anasty17)
