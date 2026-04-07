import instance from '@/utils/request'
export const loginService = (username, password, role) => {
  return instance.post('/api/login', { username, password, role })
}
export const registerService = (
  username,
  real_name,
  user_no,
  phone,
  email,
  password,
  department,
  role,
) => {
  return instance.post('/api/register', {
    username,
    real_name,
    user_no,
    phone,
    email,
    password,
    department,
    role,
  })
}
