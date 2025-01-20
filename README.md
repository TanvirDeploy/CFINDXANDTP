# How To Generate Token Pickle With Android Easily After Google Auth2.0 New policy update and How to create client id, client secret, refresh token for cloudflare . Without any kind of error.

### 1. Install Termux [F-Droid](https://f-droid.org/en/packages/com.termux/)

### 2. Open Termux and just copy paste all the commands that described below, Make sure you have internet connection. if you see Y/n then Type y.

```
apt update && apt upgrade -y && pkg install git -y && pkg install python -y && apt update && pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib && pip install --upgrade pip

```
2.1 ```ERROR: Installing pip is forbidden, this will break the python-pip package (termux)```If you get this error, you need to run the following command:

```curl -sS https://bootstrap.pypa.io/get-pip.py | python```

Now run command number 2 again. Hopefully no error will appear.

### 3.

```
git clone https://github.com/FollowNaim/TokenPickle
```

### 4. make sure Credentials.json file present in your storage folder not in Sd card. if not then just move credentials.json file into the sdcard. Not in any folder.

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
python3 GenerateTokenPickle.py
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
