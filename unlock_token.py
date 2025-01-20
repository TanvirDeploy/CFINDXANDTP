import pickle

# token.pickle ফাইলটি ওপেন করুন
with open("token.pickle", "rb") as token_file:
    credentials = pickle.load(token_file)

# ফাইলের ভেতরের তথ্য প্রিন্ট করুন
print("Access Token:", credentials.token)
print("Refresh Token:", credentials.refresh_token)
print("Token Expiry:", credentials.expiry)
print("Client ID:", credentials.client_id)
print("Client Secret:", credentials.client_secret)
