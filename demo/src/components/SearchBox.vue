<template>
  <div class="search-box">
    <input type="text" placeholder="搜索" />
    <button>🔍</button>
  </div>
</template>
<style scoped>
.search-box {
  position: relative;
}
.search-box input {
  width: 280px;
  padding: 10px 40px 10px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 24px;
  font-size: 14px;
  transition: border-color 0.3s;
}
.search-box input:focus {
  outline: none;
  border-color: #667eea;
}
.search-box button {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
}
</style>
