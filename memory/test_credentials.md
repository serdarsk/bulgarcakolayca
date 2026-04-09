# Test Credentials for BulgarcaKolayca

## Teacher Account
- **Email:** bulgarcakolayca@gmail.com
- **Password:** Fatma123
- **Name:** Fatma Uslu Özşeker
- **Role:** teacher
- **Access:** Full admin panel at /panel/teacher

## Test Student Account
To test student flow:
1. Register at /panel/register
2. Teacher must approve at /panel/teacher > Students tab
3. Then login at /panel/login

## API Endpoints
- Login: POST /api/auth/login
- Register: POST /api/auth/register
- Init Teacher: POST /api/init-teacher (one-time setup)
- Change Password: PUT /api/auth/change-password
- Update Profile: PUT /api/auth/profile
