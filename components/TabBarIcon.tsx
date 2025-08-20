import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { StyleSheet } from 'react-native';

type FontFamily = 'FontAwesome' | 'FontAwesome5' | 'FontAwesome6';

export const TabBarIcon = (props: {
  name: string;
  color: string;
  family?: FontFamily;
}) => {
  const { family = 'FontAwesome6', ...iconProps } = props;
  
  switch (family) {
    case 'FontAwesome':
      return <FontAwesome size={28} style={styles.tabBarIcon} {...iconProps} />;
    case 'FontAwesome5':
      return <FontAwesome5 size={28} style={styles.tabBarIcon} {...iconProps} />;
    case 'FontAwesome6':
    default:
      return <FontAwesome6 size={28} style={styles.tabBarIcon} {...iconProps} />;
  }
};

export const styles = StyleSheet.create({
  tabBarIcon: {
    marginBottom: -3,
  },
});
