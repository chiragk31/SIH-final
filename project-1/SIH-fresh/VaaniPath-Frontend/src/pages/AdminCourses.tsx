import { useState, useEffect } from 'react'; // Restored imports
import { useAuth } from '@/contexts/AuthContext';
import { getAllCourses, deleteCourse } from '@/services/courses'; // Added deleteCourse
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Search, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AdminCourses() {
    const { isAdmin } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [courses, setCourses] = useState<any[]>([]);
    const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState<string | null>(null); // Track deleting state per course ID

    useEffect(() => {
        if (!isAdmin) {
            navigate('/login');
            return;
        }
        loadCourses();
    }, [isAdmin]);

    useEffect(() => {
        // Filter courses based on search query
        if (searchQuery.trim() === '') {
            setFilteredCourses(courses);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = courses.filter(
                course =>
                    course.title.toLowerCase().includes(query) ||
                    (course.teacher_name && course.teacher_name.toLowerCase().includes(query))
            );
            setFilteredCourses(filtered);
        }
    }, [searchQuery, courses]);

    const loadCourses = async () => {
        try {
            setIsLoading(true);
            const response = await getAllCourses({ page: 1, page_size: 100 });
            setCourses(response.courses);
            setFilteredCourses(response.courses);
        } catch (error) {
            console.error('Failed to load courses:', error);
            toast({
                title: 'Error',
                description: 'Failed to load courses list',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (courseId: string, courseTitle: string) => {
        if (!window.confirm(`Are you sure you want to delete the course "${courseTitle}"? This action cannot be undone.`)) {
            return;
        }

        try {
            setIsDeleting(courseId);
            await deleteCourse(courseId);
            toast({
                title: 'Success',
                description: 'Course deleted successfully',
            });
            // Remove from list locally
            setCourses(prev => prev.filter(c => c.id !== courseId));
            setFilteredCourses(prev => prev.filter(c => c.id !== courseId));
        } catch (error) {
            console.error('Failed to delete course:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete course',
                variant: 'destructive'
            });
        } finally {
            setIsDeleting(null);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Course Management</h2>
                    <p className="text-muted-foreground">
                        View and manage all courses on the platform
                    </p>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by title or instructor..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Courses List */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>All Courses</CardTitle>
                                <CardDescription>
                                    Total: {filteredCourses.length} {filteredCourses.length !== courses.length && `of ${courses.length}`}
                                </CardDescription>
                            </div>
                            <BookOpen className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Loading courses...
                            </div>
                        ) : filteredCourses.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                {searchQuery ? 'No courses found matching your search.' : 'No courses available.'}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredCourses.map((course) => (
                                    <div
                                        key={course.id}
                                        className="flex justify-between items-center p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                                    >
                                        <div className="flex gap-4 items-center">
                                            {course.thumbnail_url && (
                                                <img 
                                                    src={course.thumbnail_url} 
                                                    alt={course.title} 
                                                    className="w-16 h-10 object-cover rounded"
                                                />
                                            )}
                                            <div>
                                                <p className="font-medium">{course.title}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    by {course.teacher_name || 'Unknown Instructor'}
                                                </p>
                                            </div>
                                        </div>
                                        
                                            <div className="flex items-center gap-6">
                                             <div className="text-sm text-right">
                                                <p className="text-muted-foreground">{course.total_videos || 0} Videos</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(course.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <Badge variant="outline">{course.domain}</Badge>
                                            
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDelete(course.id, course.title)}
                                                disabled={isDeleting === course.id}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                            
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
