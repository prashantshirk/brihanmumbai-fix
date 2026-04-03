"""
BrihanMumbai Fix - Admin Creation Script

Run once to create admin: python create_admin.py
Then delete or keep this file — never expose it as an API endpoint

This script manually creates admin users in MongoDB.
Admins can login at /admin/login and manage all complaints.
"""

import os
from datetime import datetime
from dotenv import load_dotenv
from pymongo import MongoClient
import bcrypt

# Load environment variables
load_dotenv()

def create_admin():
    """Create a new admin user in MongoDB"""
    
    # Connect to MongoDB
    MONGO_URI = os.getenv('MONGO_URI')
    if not MONGO_URI:
        print("❌ Error: MONGO_URI not found in .env file")
        return
    
    try:
        client = MongoClient(MONGO_URI)
        db = client['brihanmumbai_fix']
        users_collection = db.users
        
        print("=" * 50)
        print("BrihanMumbai Fix - Admin Account Creator")
        print("=" * 50)
        print()
        
        # Get admin details from terminal
        name = input("Enter admin name: ").strip()
        if not name:
            print("❌ Error: Name cannot be empty")
            return
        
        email = input("Enter admin email: ").strip().lower()
        if not email:
            print("❌ Error: Email cannot be empty")
            return
        
        # Validate email format (basic check)
        if '@' not in email or '.' not in email:
            print("❌ Error: Invalid email format")
            return
        
        password = input("Enter admin password (min 8 characters): ").strip()
        if len(password) < 8:
            print("❌ Error: Password must be at least 8 characters")
            return
        
        # Check if email already exists
        existing_user = users_collection.find_one({'email': email})
        if existing_user:
            print(f"❌ Error: User with email '{email}' already exists")
            return
        
        # Hash password with bcrypt (cost factor 12)
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(12))
        
        # Create admin user document
        admin_doc = {
            'name': name,
            'email': email,
            'password_hash': password_hash,
            'role': 'admin',
            'created_at': datetime.utcnow()
        }
        
        # Insert into database
        result = users_collection.insert_one(admin_doc)
        
        print()
        print("=" * 50)
        print("✅ Admin created successfully!")
        print("=" * 50)
        print(f"Name:  {name}")
        print(f"Email: {email}")
        print(f"Role:  admin")
        print(f"ID:    {result.inserted_id}")
        print()
        print("Admin can now login at: /admin/login")
        print("=" * 50)
        
    except Exception as e:
        print(f"❌ Error: Failed to create admin - {str(e)}")
    finally:
        client.close()

if __name__ == '__main__':
    create_admin()
