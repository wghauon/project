import { createRouter, createWebHistory } from 'vue-router'
// 路由配置
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: () => import('@/views/common/Login.vue') },
    { path: '/register', component: () => import('@/views/common/Register.vue') },
    // 学生页面
    {
      path: '/student',
      component: () => import('@/views/student/Index.vue'),
      redirect: '/student/class',
      children: [
        { path: 'class', component: () => import('@/views/student/ClassSquare.vue') },
        { path: 'my-courses', component: () => import('@/views/student/MyCourses.vue') },
        { path: 'exams', component: () => import('@/views/student/Exams.vue') },
        { path: 'room-list', component: () => import('@/views/student/RoomList.vue') },
      ],
    },
    // 管理员页面
    {
      path: '/admin',
      component: () => import('@/views/admin/Index.vue'),
      redirect: '/admin/dashboard',
      children: [
        { path: 'dashboard', component: () => import('@/views/admin/Dashboard.vue') },
        { path: 'announcements', component: () => import('@/views/admin/Announcements.vue') },
        { path: 'course-review', component: () => import('@/views/admin/CourseReview.vue') },
        { path: 'user-manage', component: () => import('@/views/admin/UserManage.vue') },
        { path: 'data-export', component: () => import('@/views/admin/DataExport.vue') },
      ],
    },
    // 教师页面
    {
      path: '/teacher',
      component: () => import('@/views/teacher/Index.vue'),
      redirect: '/teacher/my-teaching',
      children: [
        { path: 'my-teaching', component: () => import('@/views/teacher/MyTeaching.vue') },
        {
          path: 'course-manage/:course_id',
          component: () => import('@/views/teacher/CourseManage.vue'),
          children: [
            {
              path: 'chapter-manage',
              component: () => import('@/views/teacher/ChapterManage.vue'),
            },
            { path: 'video-manage', component: () => import('@/views/teacher/VideoManage.vue') },
          ],
        },
        { path: 'exam-manage', component: () => import('@/views/teacher/ExamManage.vue') },
        { path: 'student-manage', component: () => import('@/views/teacher/StudentManage.vue') },
        { path: 'create-course', component: () => import('@/views/teacher/CreateCourse.vue') },
        { path: 'chapter-add', component: () => import('@/views/teacher/ChapterAdd.vue') },
        { path: 'video-upload', component: () => import('@/views/teacher/VideoUpload.vue') },
        {
          path: 'video-preview/:video_id',
          component: () => import('@/views/teacher/VideoPreview.vue'),
        },
        { path: 'video-edit', component: () => import('@/views/teacher/VideoEdit.vue') },
      ],
    },
  ],
})

export default router
