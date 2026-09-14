#@title <center>𝙏𝙚𝙡𝙚𝙜𝙧𝙖𝙢 𝙐𝙨𝙚𝙧 𝙎𝙚𝙨𝙨𝙞𝙤𝙣</center>

#@markdown ---
#@markdown ### 🔐 Telegram API Credentials

API_KEY = 0  #@param {type:"integer"}
API_HASH = ""  #@param {type:"string"}
PHONE = ""  #@param {type:"string"}

#@markdown ---
#@markdown ### 📚 Library

Mode = "wzgram"  #@param ["wzgram", "pyrogram", "pyrofork", "pyrotgfork", "telethon"]

#@markdown ---
#@markdown ### 📦 Version

Wzgram_Version = "latest"  #@param ["none", "latest"]
Pyrogram_Version = "none"  #@param ["none", "2.0.66", "2.0.77", "2.0.106", "latest"]
Pyrofork_Version = "none"  #@param ["none", "2.2.10", "2.3.68", "latest"]
Pyrotgfork_Version = "none"  #@param ["none", "2.2.17", "latest"]
Telethon_Version = "none"  #@param ["none", "latest"]


# ============================================================
# INSTALL LIBRARY
# ============================================================

if Mode == "wzgram":

    version = Wzgram_Version if Wzgram_Version != "none" else "latest"

    !pip install -q wzgram

    header = f"#WZGRAM_SESSION_{version}"


elif Mode == "pyrogram":

    version = Pyrogram_Version if Pyrogram_Version != "none" else "latest"

    if version == "latest":
        !pip install -q pyrogram tgcrypto
    else:
        !pip install -q pyrogram=={version} tgcrypto

    header = f"#PYROGRAM_SESSION_{version}"


elif Mode == "pyrofork":

    version = Pyrofork_Version if Pyrofork_Version != "none" else "latest"

    if version == "latest":
        !pip install -q pyrofork tgcrypto
    else:
        !pip install -q pyrofork=={version} tgcrypto

    header = f"#PYROFORK_SESSION_{version}"


elif Mode == "pyrotgfork":

    version = Pyrotgfork_Version if Pyrotgfork_Version != "none" else "latest"

    if version == "latest":
        !pip install -q pyrotgfork tgcrypto
    else:
        !pip install -q pyrotgfork=={version} tgcrypto

    header = f"#PYROTGFORK_SESSION_{version}"


elif Mode == "telethon":

    version = Telethon_Version if Telethon_Version != "none" else "latest"

    if version == "latest":
        !pip install -q telethon cryptg
    else:
        !pip install -q telethon=={version} cryptg

    header = f"#TELETHON_SESSION_{version}"


# ============================================================
# CLEAR OUTPUT
# ============================================================

from IPython.display import clear_output

clear_output()

print("=" * 50)
print(f"Successfully Installed {header}")
print("=" * 50)


# ============================================================
# TELETHON
# ============================================================

if Mode == "telethon":

    from telethon import TelegramClient
    from telethon.sessions import StringSession

    async with TelegramClient(
        StringSession(),
        API_KEY,
        API_HASH
    ) as user:

        session_string = user.session.save()

        print("\nGenerating Session...")

        try:

            await user.send_message(
                "me",
                f"#WZMLX {header}\n\n`{session_string}`"
            )

            print("\n✅ String Session sent to Saved Messages!")

        except Exception:

            print("\n#WZMLX", header)
            print(session_string)

            print("\n✅ String Session generated successfully!")


# ============================================================
# PYROGRAM / WZGRAM
# ============================================================

else:

    from pyrogram import Client

    if not API_KEY:
        raise ValueError(
            "❌ API_KEY is missing. Please enter your Telegram API ID."
        )

    if not API_HASH:
        raise ValueError(
            "❌ API_HASH is missing. Please enter your Telegram API Hash."
        )

    if not PHONE:
        raise ValueError(
            "❌ PHONE is missing. Please enter your Telegram phone number."
        )


    async with Client(
        name="WZ-User",
        in_memory=True,
        api_id=API_KEY,
        api_hash=API_HASH,
        phone_number=PHONE,
        app_version="@WZML_X User Session",
        device_model="@WZML_X Bot V3",
        system_version="@WZML_X WzPyro Server"
    ) as app:

        session_string = await app.export_session_string()

        print("\nGenerating Session...")

        try:

            await app.send_message(
                "me",
                f"#WZMLX {header}\n\n<code>{session_string}</code>"
            )

            print("\n✅ String Session sent to Saved Messages!")

        except Exception:

            print("\n#WZMLX", header)
            print(session_string)

            print("\n✅ String Session generated successfully!")


print("\n" + "=" * 50)
print("              DONE ✅")
print("=" * 50)
