from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
hash_val = pwd_context.hash("Admin123!")
print(hash_val)
