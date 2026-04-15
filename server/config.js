// 全局配置文件

module.exports = {
  // 加密与解密的密钥
  jwtSecretKey: 'jwt-secret-key',
  // access token有效期（15分钟）
  accessTokenExpiresIn: '15m',
  // refresh token有效期（7天）
  refreshTokenExpiresIn: '7d',
  // refresh token密钥
  refreshTokenSecretKey: 'refresh-token-secret-key'
}