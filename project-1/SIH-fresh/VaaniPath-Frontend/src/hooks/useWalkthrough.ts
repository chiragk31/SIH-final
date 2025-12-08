import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export const useWalkthrough = () => {
    const startStudentTour = () => {
        const driverObj = driver({
          showProgress: true,
          steps: [
            { element: '#header-logo', popover: { title: 'Welcome to VaaniPath', description: 'Your personalized learning journey starts here.' } },
            { element: '#header-nav', popover: { title: 'Navigation', description: 'Access courses, community, and more.' } },
            { element: '#student-profile', popover: { title: 'Profile', description: 'Manage your account and settings.' } },
            { element: '#continue-learning', popover: { title: 'Jump Back In', description: 'Continue where you left off. Track your progress here.' } },
            { element: '#featured-courses', popover: { title: 'Explore', description: 'Discover new courses tailored for you.' } },
          ]
        });
        driverObj.drive();
    };
    
    const startTeacherTour = () => {
        const driverObj = driver({
          showProgress: true,
          steps: [
            { element: '#header-logo', popover: { title: 'Instructor Portal', description: 'Manage your teaching journey.' } },
            { element: '#teacher-stats-overview', popover: { title: 'Overview', description: 'Quick stats about your students and courses.' } },
            { element: '#quick-action-0', popover: { title: 'Create Course', description: 'Start creating a new course here.' } },
            { element: '#recent-courses', popover: { title: 'Your Courses', description: 'Manage and update your published courses.' } },
          ]
        });
        driverObj.drive();
    };
    
    const startCreateCourseTour = () => {
        const driverObj = driver({
          showProgress: true,
          steps: [
            { element: '#course-title-section', popover: { title: 'Course Title', description: 'Give your course a catchy and descriptive title.' } },
            { element: '#course-domain-section', popover: { title: 'Subject Domain', description: 'Select the category that best fits your course.' } },
            { element: '#course-language-section', popover: { title: 'Languages', description: 'Choose the source language and target languages for translation.' } },
            { element: '#course-thumbnail-section', popover: { title: 'Thumbnail', description: 'Upload an engaging thumbnail for your course.' } },
            { element: '#course-guidelines-section', popover: { title: 'Platform Guidelines', description: 'IMPORTANT: You must agree to the terms and conditions to proceed.' } },
            { element: '#create-course-submit', popover: { title: 'Create Course', description: 'Click here to publish your new course!' } },
          ]
        });
        driverObj.drive();
    };

    const startStudentLoginTour = () => {
        const driverObj = driver({
            showProgress: true,
            steps: [
                { element: '#student-login-card', popover: { title: 'Student Portal', description: 'Login here to access your courses and learning materials.' } },
                { element: '#student-email-section', popover: { title: 'Email Address', description: 'Enter your registered student email address.' } },
                { element: '#student-password-section', popover: { title: 'Password', description: 'Enter your account password.' } },
                { element: '#student-login-btn', popover: { title: 'Login', description: 'Click to access your dashboard.' } },
            ]
        });
        driverObj.drive();
    };

    const startTeacherLoginTour = () => {
        const driverObj = driver({
            showProgress: true,
            steps: [
                { element: '#teacher-login-card', popover: { title: 'Educator Portal', description: 'Login to manage your courses and students.' } },
                { element: '#teacher-email-section', popover: { title: 'Email Address', description: 'Enter your registered educator email.' } },
                { element: '#teacher-password-section', popover: { title: 'Password', description: 'Enter your secure password.' } },
                { element: '#teacher-login-btn', popover: { title: 'Login', description: 'Click to access your teacher dashboard.' } },
            ]
        });
        driverObj.drive();
    };
    
    return { startStudentTour, startTeacherTour, startCreateCourseTour, startStudentLoginTour, startTeacherLoginTour };
};
