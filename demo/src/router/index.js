import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

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
      meta: { requiresAuth: true, role: 1 },
      children: [
        { path: 'class', component: () => import('@/views/student/ClassSquare.vue') },
        { path: 'my-courses', component: () => import('@/views/student/MyCourses.vue') },
        { path: 'course-study/:courseId', component: () => import('@/views/student/CourseStudy.vue') },
        { path: 'exams', component: () => import('@/views/student/Exams.vue') },
        { path: 'exam-taking/:examId', component: () => import('@/views/student/ExamTaking.vue') },
        { path: 'exam-result/:examId', component: () => import('@/views/student/ExamResult.vue') },
        { path: 'experiments', component: () => import('@/views/student/Experiments.vue') },
        { path: 'discussions', component: () => import('@/views/student/Discussions.vue') },
        { path: 'notifications', component: () => import('@/views/student/Notifications.vue') },
        { path: 'flowchart', component: () => import('@/views/student/Flowchart.vue') },
        { path: 'room-list', component: () => import('@/views/student/RoomList.vue') },
        { path: 'announcements', component: () => import('@/views/student/Announcements.vue') },
      ],
    },
    // 管理员页面
    {
      path: '/admin',
      component: () => import('@/views/admin/Index.vue'),
      redirect: '/admin/dashboard',
      meta: { requiresAuth: true, role: 3 },
      children: [
        { path: 'dashboard', component: () => import('@/views/admin/Dashboard.vue') },
        { path: 'user-manage', component: () => import('@/views/admin/UserManage.vue') },
        { path: 'announcements', component: () => import('@/views/admin/Announcements.vue') },
        { path: 'course-review', component: () => import('@/views/admin/CourseReview.vue') },
      ],
    },
    // 教师页面
    {
      path: '/teacher',
      component: () => import('@/views/teacher/Index.vue'),
      redirect: '/teacher/my-teaching',
      meta: { requiresAuth: true, role: 2 },
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
            { path: 'material-manage', component: () => import('@/views/teacher/MaterialManage.vue') },
          ],
        },
        { path: 'exam-manage', component: () => import('@/views/teacher/ExamManage.vue') },
        { path: 'student-manage', component: () => import('@/views/teacher/StudentManage.vue') },
        { path: 'create-course', component: () => import('@/views/teacher/CreateCourse.vue') },
        { path: 'edit-course/:courseId', component: () => import('@/views/teacher/EditCourse.vue') },
        { path: 'chapter-add', component: () => import('@/views/teacher/ChapterAdd.vue') },
        { path: 'video-upload', component: () => import('@/views/teacher/VideoUpload.vue') },
        {
          path: 'video-preview/:video_id',
          component: () => import('@/views/teacher/VideoPreview.vue'),
        },
        { path: 'video-edit/:videoId', component: () => import('@/views/teacher/VideoEdit.vue') },
        { path: 'announcements', component: () => import('@/views/teacher/Announcements.vue') },
      ],
    },
  ],
})

// 路由守卫
router.beforeEach((to, from) => {
  const userStore = useUserStore()

  // 需要登录的页面
  if (to.meta.requiresAuth) {
    // 未登录（没有accessToken），跳转到登录页
    if (!userStore.accessToken) {
      return { path: '/' }
    }

    // 检查角色权限
    if (to.meta.role && userStore.role != to.meta.role) {
      // 角色不匹配，根据角色跳转到对应首页
      if (userStore.role == 1) {
        return { path: '/student' }
      } else if (userStore.role == 2) {
        return { path: '/teacher' }
      } else if (userStore.role == 3) {
        return { path: '/admin' }
      }
      return { path: '/' }
    }
  }

  // 已登录用户访问登录页，跳转到对应首页
  if (to.path === '/' && userStore.accessToken) {
    if (userStore.role == 1) {
      return { path: '/student' }
    } else if (userStore.role == 2) {
      return { path: '/teacher' }
    } else if (userStore.role == 3) {
      return { path: '/admin' }
    }
  }
})

export default router
