import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';

// Sample incident data
const defaultIncidents = [
  {
    id: 1,
    title: 'Road erosion near Port Antonio',
    location: 'Portland',
    status: 'verified',
    time: '2 hours ago',
  },
  {
    id: 2,
    title: 'Landslide on Junction Road',
    location: 'St. Thomas',
    status: 'review',
    time: '5 hours ago',
  },
  {
    id: 3,
    title: 'Blocked drainage in Linstead',
    location: 'St. Catherine',
    status: 'new',
    time: '1 day ago',
  },
  {
    id: 4,
    title: 'Pothole cluster on Harbour View',
    location: 'St. Andrew',
    status: 'verified',
    time: '1 day ago',
  },
];

const IncidentPanel = ({ incidents = defaultIncidents, showAdminControls = false }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'verified':
        return { 
          color: colors.success, 
          label: 'Verified', 
          icon: 'checkmark-circle' 
        };
      case 'review':
        return { 
          color: colors.info, 
          label: 'Under Review', 
          icon: 'time-outline' 
        };
      case 'new':
        return { 
          color: colors.warning, 
          label: 'New Report', 
          icon: 'alert-circle-outline' 
        };
      default:
        return { 
          color: colors.textSecondary, 
          label: 'Unknown', 
          icon: 'help-circle-outline' 
        };
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Incident Reports</Text>
        <TouchableOpacity>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {incidents.map((incident) => {
          const statusConfig = getStatusConfig(incident.status);
          return (
            <View key={incident.id} style={styles.incidentCard}>
              <View style={styles.incidentHeader}>
                <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '20' }]}>
                  <Ionicons 
                    name={statusConfig.icon} 
                    size={14} 
                    color={statusConfig.color} 
                  />
                  <Text style={[styles.statusText, { color: statusConfig.color }]}>
                    {statusConfig.label}
                  </Text>
                </View>
                
                {/* Admin-only: Action buttons */}
                {showAdminControls && (
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="ellipsis-vertical" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
              
              <Text style={styles.incidentTitle} numberOfLines={2}>
                {incident.title}
              </Text>
              
              <View style={styles.incidentFooter}>
                <View style={styles.locationContainer}>
                  <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.locationText}>{incident.location}</Text>
                </View>
                <Text style={styles.timeText}>{incident.time}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
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
  scrollContent: {
    paddingRight: 16,
  },
  incidentCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    marginRight: 12,
    width: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  incidentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  actionButton: {
    padding: 4,
  },
  incidentTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 12,
    lineHeight: 20,
  },
  incidentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  timeText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});

export default IncidentPanel;
