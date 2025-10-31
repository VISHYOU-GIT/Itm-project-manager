import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  LinearProgress,
  Chip,
  IconButton,
  Button,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
} from '@mui/material';
import {
  TrendingUp,
  Assignment,
  Group,
  School,
  Notifications,
  Add,
  Update,
  AccessTime,
  CheckCircle,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import useAuthStore from '../store/authStore';
import { studentAPI, teacherAPI, adminAPI } from '../utils/api';

const StatCard = ({ title, value, subtitle, color, icon, trend }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Card 
      sx={{ 
        height: '100%',
        background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
        border: `1px solid ${color}20`,
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h3" component="div" color={color} fontWeight="bold">
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
        {trend && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
            <TrendingUp sx={{ color: 'success.main', mr: 0.5, fontSize: 16 }} />
            <Typography variant="caption" color="success.main">
              {trend}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  </motion.div>
);

const Dashboard = () => {
  const { user } = useAuthStore();

  // Student Dashboard Data
  const { data: studentProfile } = useQuery({
    queryKey: ['student-profile'],
    queryFn: studentAPI.getProfile,
    enabled: user?.role === 'student',
    select: (response) => response.data,
  });

  const { data: studentProgress } = useQuery({
    queryKey: ['student-progress'],
    queryFn: studentAPI.getProgress,
    enabled: user?.role === 'student',
    select: (response) => response.data,
  });

  const { data: studentUpdates } = useQuery({
    queryKey: ['student-updates'],
    queryFn: studentAPI.getDailyUpdates,
    enabled: user?.role === 'student',
    select: (response) => response.data.updates.slice(0, 5),
  });

  // Teacher Dashboard Data
  const { data: teacherProfile } = useQuery({
    queryKey: ['teacher-profile'],
    queryFn: teacherAPI.getProfile,
    enabled: user?.role === 'teacher',
    select: (response) => response.data,
  });

  const { data: teacherUpdates } = useQuery({
    queryKey: ['teacher-latest-updates'],
    queryFn: () => teacherAPI.getLatestUpdates({ limit: 5 }),
    enabled: user?.role === 'teacher',
    select: (response) => response.data,
  });

  // Admin Dashboard Data
  const { data: adminStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminAPI.getDashboardStats,
    enabled: user?.role === 'admin',
    select: (response) => response.data,
  });

  const renderStudentDashboard = () => (
    <Grid container spacing={3}>
      {/* Stats Cards */}
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Project Progress"
          value={`${studentProgress?.project?.progress || 0}%`}
          subtitle="Overall completion"
          color="#1976d2"
          icon={<TrendingUp />}
          trend={studentProgress?.project?.progress > 50 ? "On track" : "Needs attention"}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Updates"
          value={studentUpdates?.length || 0}
          subtitle="Daily updates submitted"
          color="#2e7d32"
          icon={<Update />}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Targets Completed"
          value={`${studentProgress?.project?.targets?.filter(t => t.completed).length || 0}/${studentProgress?.project?.targets?.length || 0}`}
          subtitle="Project milestones"
          color="#ed6c02"
          icon={<CheckCircle />}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Project Status"
          value={studentProgress?.project?.status?.toUpperCase() || 'N/A'}
          subtitle="Current state"
          color="#9c27b0"
          icon={<Assignment />}
        />
      </Grid>

      {/* Project Overview */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              My Project Overview
            </Typography>
            {studentProfile?.student?.project ? (
              <Box>
                <Typography variant="h5" color="primary" gutterBottom>
                  {studentProfile.student.project.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ mr: 2 }}>
                    <School />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1">
                      Incharge: {studentProfile.student.project.incharge?.username}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {studentProfile.student.project.incharge?.email}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Progress
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={studentProgress?.project?.progress || 0}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {studentProfile.student.partners?.map((partner) => (
                    <Chip
                      key={partner.id}
                      label={`${partner.username} (${partner.rollNo})`}
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Box>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Assignment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Project Assigned
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Request an incharge to get started with your project
                </Typography>
                <Button variant="contained" sx={{ mt: 2 }}>
                  Find Incharge
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Recent Updates */}
      <Grid item xs={12} md={4}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Updates
            </Typography>
            <List>
              {studentUpdates?.slice(0, 4).map((update, index) => (
                <React.Fragment key={update._id?.$oid || update._id}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        <AccessTime sx={{ fontSize: 16 }} />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={update.description.substring(0, 50) + '...'}
                      secondary={new Date(update.timestamp).toLocaleDateString()}
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                  {index < Math.min(studentUpdates.length - 1, 3) && <Divider />}
                </React.Fragment>
              ))}
              {(!studentUpdates || studentUpdates.length === 0) && (
                <ListItem>
                  <ListItemText 
                    primary="No updates yet"
                    secondary="Start by submitting your first update"
                  />
                </ListItem>
              )}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderTeacherDashboard = () => (
    <Grid container spacing={3}>
      {/* Stats Cards */}
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Assigned Projects"
          value={teacherProfile?.teacher?.assignedProjects?.length || 0}
          subtitle="Total projects"
          color="#1976d2"
          icon={<Assignment />}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Recent Updates"
          value={teacherUpdates?.totalUpdates || 0}
          subtitle="Student submissions"
          color="#2e7d32"
          icon={<Update />}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Active Students"
          value={teacherProfile?.teacher?.assignedProjects?.reduce((acc, p) => acc + p.students.length, 0) || 0}
          subtitle="Under supervision"
          color="#ed6c02"
          icon={<Group />}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Pending Reviews"
          value="5"
          subtitle="Require attention"
          color="#9c27b0"
          icon={<Notifications />}
        />
      </Grid>

      {/* Latest Updates */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Latest Student Updates
            </Typography>
            <List>
              {teacherUpdates?.updates?.map((update, index) => (
                <React.Fragment key={update._id?.$oid || update._id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar>
                        {update.student?.username?.[0] || 'S'}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={update.description.substring(0, 100) + '...'}
                      secondary={`${update.student?.username} - ${update.projectName} - ${new Date(update.timestamp).toLocaleDateString()}`}
                    />
                    <Chip 
                      label={update.inchargeComment ? 'Reviewed' : 'Pending'}
                      color={update.inchargeComment ? 'success' : 'warning'}
                      size="small"
                    />
                  </ListItem>
                  {index < teacherUpdates.updates.length - 1 && <Divider />}
                </React.Fragment>
              ))}
              {(!teacherUpdates?.updates || teacherUpdates.updates.length === 0) && (
                <ListItem>
                  <ListItemText 
                    primary="No updates yet"
                    secondary="Students haven't submitted any updates"
                  />
                </ListItem>
              )}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderAdminDashboard = () => (
    <Grid container spacing={3}>
      {/* Stats Cards */}
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Projects"
          value={adminStats?.stats?.totalProjects || 0}
          subtitle="All projects"
          color="#1976d2"
          icon={<Assignment />}
          trend="12% increase"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Students"
          value={adminStats?.stats?.totalStudents || 0}
          subtitle="Registered users"
          color="#2e7d32"
          icon={<Group />}
          trend="8% increase"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Teachers"
          value={adminStats?.stats?.totalTeachers || 0}
          subtitle="Active supervisors"
          color="#ed6c02"
          icon={<School />}
          trend="5% increase"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Active Projects"
          value={adminStats?.stats?.activeProjects || 0}
          subtitle="In progress"
          color="#9c27b0"
          icon={<TrendingUp />}
        />
      </Grid>

      {/* Recent Activity */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Project Activity
            </Typography>
            <List>
              {adminStats?.recentActivity?.map((activity, index) => (
                <React.Fragment key={activity.projectId?.$oid || activity.projectId}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <Assignment />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={activity.projectName}
                      secondary={`${activity.students.map(s => s.username).join(', ')} - ${activity.incharge?.username}`}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {new Date(activity.lastUpdate).toLocaleDateString()}
                    </Typography>
                  </ListItem>
                  {index < adminStats.recentActivity.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>

      {/* Quick Stats */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              System Overview
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Students with Projects
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(adminStats?.stats?.studentsWithProjects / adminStats?.stats?.totalStudents) * 100 || 0}
                sx={{ height: 8, borderRadius: 4, mb: 1 }}
              />
              <Typography variant="caption">
                {adminStats?.stats?.studentsWithProjects || 0} of {adminStats?.stats?.totalStudents || 0} students
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Completed Projects
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(adminStats?.stats?.completedProjects / adminStats?.stats?.totalProjects) * 100 || 0}
                color="success"
                sx={{ height: 8, borderRadius: 4, mb: 1 }}
              />
              <Typography variant="caption">
                {adminStats?.stats?.completedProjects || 0} of {adminStats?.stats?.totalProjects || 0} projects
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {user?.username || user?.rollNo || user?.adminId}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {user?.role === 'student' && "Here's your project overview and recent activity."}
          {user?.role === 'teacher' && "Monitor your students' progress and review their updates."}
          {user?.role === 'admin' && "Manage the entire system and track overall performance."}
        </Typography>
      </Box>

      {user?.role === 'student' && renderStudentDashboard()}
      {user?.role === 'teacher' && renderTeacherDashboard()}
      {user?.role === 'admin' && renderAdminDashboard()}
    </Box>
  );
};

export default Dashboard;
