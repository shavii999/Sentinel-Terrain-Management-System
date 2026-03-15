import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';

const KPICard = ({ title, value, unit, icon, status, trend }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'good':
      case 'healthy':
        return colors.success;
      case 'warning':
      case 'moderate':
        return colors.warning;
      case 'danger':
      case 'critical':
        return colors.danger;
      case 'info':
        return colors.info;
      default:
        return colors.textSecondary;
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend === 'up') return 'trending-up';
    if (trend === 'down') return 'trending-down';
    return 'remove';
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: getStatusColor() + '20' }]}>
          <Ionicons name={icon} size={20} color={getStatusColor()} />
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>
      
      <View style={styles.valueContainer}>
        <Text style={[styles.value, { color: getStatusColor() }]}>{value}</Text>
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>
      
      {trend && (
        <View style={styles.trendContainer}>
          <Ionicons 
            name={getTrendIcon()} 
            size={16} 
            color={trend === 'up' ? colors.success : trend === 'down' ? colors.danger : colors.textSecondary} 
          />
          <Text style={styles.trendText}>
            {trend === 'up' ? '+2.3%' : trend === 'down' ? '-1.8%' : '0%'} vs last week
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: '47%',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  unit: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  trendText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
});

export default KPICard;
