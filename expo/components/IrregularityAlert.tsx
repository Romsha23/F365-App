import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from './Card';
import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react-native';
import { IrregularityAlert as AlertType } from '../store/cycle-store';

type IrregularityAlertProps = {
  alert: AlertType;
  onDismiss: (alertId: string) => void;
  style?: any;
};

export const IrregularityAlert: React.FC<IrregularityAlertProps> = ({
  alert,
  onDismiss,
  style,
}) => {
  const getAlertConfig = (severity: AlertType['severity']) => {
    switch (severity) {
      case 'alert':
        return {
          icon: <AlertCircle size={24} color="#9333EA" />,
          backgroundColor: '#F5F0FF',
          borderColor: '#9333EA',
          titleColor: '#7E22CE',
          textColor: '#6B21A8',
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={24} color="#C44BAE" />,
          backgroundColor: '#FDF2F8',
          borderColor: '#C44BAE',
          titleColor: '#9333EA',
          textColor: '#7E22CE',
        };
      case 'info':
      default:
        return {
          icon: <Info size={24} color="#9333EA" />,
          backgroundColor: '#F5F0FF',
          borderColor: '#9333EA',
          titleColor: '#7E22CE',
          textColor: '#6B21A8',
        };
    }
  };

  const config = getAlertConfig(alert.severity);

  const cardStyle = [
    styles.container,
    {
      backgroundColor: config.backgroundColor,
      borderLeftColor: config.borderColor,
    },
    style,
  ];

  return (
    <Card style={cardStyle as any}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>{config.icon}</View>
        
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: config.titleColor }]}>
            {alert.title}
          </Text>
          <Text style={[styles.message, { color: config.textColor }]}>
            {alert.message}
          </Text>
        </View>
        
        <TouchableOpacity
          onPress={() => onDismiss(alert.id)}
          style={styles.dismissButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={20} color={config.titleColor} />
        </TouchableOpacity>
      </View>
    </Card>
  );
};

type IrregularityAlertsListProps = {
  alerts: AlertType[];
  onDismiss: (alertId: string) => void;
  maxVisible?: number;
  style?: any;
};

export const IrregularityAlertsList: React.FC<IrregularityAlertsListProps> = ({
  alerts,
  onDismiss,
  maxVisible = 3,
  style,
}) => {
  const activeAlerts = alerts
    .filter(alert => !alert.dismissed)
    .sort((a, b) => {
      const severityOrder = { alert: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    })
    .slice(0, maxVisible);

  if (activeAlerts.length === 0) {
    return null;
  }

  return (
    <View style={[styles.listContainer, style]}>
      {activeAlerts.map((alert) => (
        <IrregularityAlert
          key={alert.id}
          alert={alert}
          onDismiss={onDismiss}
          style={styles.alertItem}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderLeftWidth: 4,
    marginVertical: 6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconContainer: {
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  dismissButton: {
    padding: 4,
    marginTop: -4,
  },
  listContainer: {
    marginVertical: 8,
  },
  alertItem: {
    marginVertical: 4,
  },
});
