import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';

// Sample task data
const defaultTasks = [
  {
    id: 1,
    title: 'Drainage clearing at Bog Walk Gorge',
    location: 'St. Catherine',
    urgency: 'urgent',
    status: 'In Progress',
    crew: 'Team Alpha',
  },
  {
    id: 2,
    title: 'Slope stabilization repair',
    location: 'Portland',
    urgency: 'scheduled',
    status: 'Scheduled',
    crew: 'Team Beta',
  },
  {
    id: 3,
    title: 'Pothole patching - Harbour View',
    location: 'St. Andrew',
    urgency: 'urgent',
    status: 'Pending',
    crew: 'Team Gamma',
  },
  {
    id: 4,
    title: 'Bridge inspection - Milk River',
    location: 'St. Thomas',
    urgency: 'scheduled',
    status: 'Completed',
    crew: 'Team Alpha',
  },
];

const TaskManager = ({ tasks = defaultTasks }) => {
  const getUrgencyConfig = (urgency) => {
    switch (urgency) {
      case 'urgent':
        return { 
          color: colors.danger, 
          label: 'Urgent', 
          icon: 'alert-circle' 
        };
      case 'scheduled':
        return { 
          color: colors.info, 
          label: 'Scheduled', 
          icon: 'calendar' 
        };
      default:
        return { 
          color: colors.textSecondary, 
          label: 'Normal', 
          icon: 'checkmark-circle' 
        };
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return colors.success;
      case 'In Progress':
        return colors.primary;
      case 'Pending':
        return colors.warning;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Maintenance Task Manager</Text>
        <TouchableOpacity>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.taskList}>
        {tasks.map((task) => {
          const urgencyConfig = getUrgencyConfig(task.urgency);
          return (
            <View key={task.id} style={styles.taskCard}>
              <View style={styles.taskLeft}>
                <View style={[styles.urgencyIndicator, { backgroundColor: urgencyConfig.color }]} />
                <View style={styles.taskContent}>
                  <Text style={styles.taskTitle} numberOfLines={1}>
                    {task.title}
                  </Text>
                  <View style={styles.taskMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
                      <Text style={styles.metaText}>{task.location}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="people-outline" size={12} color={colors.textSecondary} />
                      <Text style={styles.metaText}>{task.crew}</Text>
                    </View>
                  </View>
                </View>
              </View>
              
              <View style={styles.taskRight}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(task.status) }]}>
                    {task.status}
                  </Text>
                </View>
                <View style={[styles.urgencyBadge, { backgroundColor: urgencyConfig.color + '20' }]}>
                  <Ionicons name={urgencyConfig.icon} size={12} color={urgencyConfig.color} />
                  <Text style={[styles.urgencyText, { color: urgencyConfig.color }]}>
                    {urgencyConfig.label}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  viewAll: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  taskList: {
    gap: 10,
  },
  taskCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  urgencyIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  taskMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  taskRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 4,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '600',
  },
});

export default TaskManager;
