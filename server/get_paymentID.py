#!/usr/bin/env python3
import requests

auth_token = input("Enter your Resy auth token: ").strip()

headers = {
    'Authorization': 'ResyAPI api_key="VbWk7s3L4KiK5fzlO7JD3Q5EYolJI7n5"',
    'X-Resy-Auth-Token': auth_token,
    'X-Resy-Universal-Auth': auth_token,
}

response = requests.get('https://api.resy.com/3/user/payment_methods', headers=headers)

if response.status_code == 200:
    try:
        data = response.json()
        if data.get('payment_methods'):
            for pm in data['payment_methods']:
                print(f"\nPayment Method ID: {pm['id']}")
                print(f"Type: {pm.get('display', 'N/A')}")
                print(f"Provider: {pm.get('provider_name', 'N/A')}")
        else:
            print("No payment methods found on this account.")
    except requests.exceptions.JSONDecodeError:
        print(f"Invalid response format: {response.text}")
else:
    print(f"Error: {response.status_code}")
    print(response.text)