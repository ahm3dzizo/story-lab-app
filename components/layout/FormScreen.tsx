import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Animated,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  ViewStyle,
  StyleProp,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useTheme } from '../../lib/theme/ThemeProvider';
import type { Theme } from '../../lib/theme/types';
import { ProgressBar, Text, Surface, Chip } from 'react-native-paper';
import { BaseScreen } from './BaseScreen';
import { ShimmerGroup } from '../../lib/animations/Shimmer';

// Define choice option type
export interface ChoiceOption {
  id: string | number;
  label: string;
  icon?: string;
  description?: string;
}

interface FormScreenProps {
  children: React.ReactNode;
  title: string;
  loading?: boolean;
  submitting?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  LoadingComponent?: React.ReactNode;
  onSubmit?: () => Promise<void>;
  hideKeyboardAvoidingView?: boolean;
  // Slide choice menu props
  choiceOptions?: ChoiceOption[];
  selectedChoice?: string | number | null;
  onChoiceSelect?: (id: string | number) => void;
  choiceTitle?: string;
}

export const FormScreen: React.FC<FormScreenProps> = ({
  children,
  title,
  loading = false,
  submitting = false,
  style,
  contentContainerStyle,
  LoadingComponent,
  onSubmit,
  hideKeyboardAvoidingView = false,
  choiceOptions = [],
  selectedChoice = null,
  onChoiceSelect,
  choiceTitle,
}) => {
  const { theme } = useTheme();
  const submitAnimation = useRef(new Animated.Value(0)).current;
  const currentStyles = styles(theme);
  const [activeChoice, setActiveChoice] = useState<string | number | null>(selectedChoice);
  const slideRef = useRef<FlatList>(null);

  useEffect(() => {
    setActiveChoice(selectedChoice);
  }, [selectedChoice]);

  useEffect(() => {
    if (submitting) {
      Animated.timing(submitAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(submitAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      submitAnimation.setValue(0);
    };
  }, [submitting]);

  const handleChoiceSelect = (id: string | number) => {
    setActiveChoice(id);
    if (onChoiceSelect) {
      onChoiceSelect(id);
    }
  };

  const defaultLoadingComponent = (
    <View style={currentStyles.loadingContainer}>
      <ShimmerGroup
        count={1}
        itemStyle={{ height: 60, marginBottom: 16, borderRadius: 8 }}
      />
      <ShimmerGroup
        count={3}
        itemStyle={{ height: 48, marginBottom: 16, borderRadius: 8 }}
      />
      <ShimmerGroup
        count={1}
        itemStyle={{ height: 120, marginBottom: 16, borderRadius: 8 }}
      />
      <ShimmerGroup
        count={1}
        itemStyle={{ height: 48, marginTop: 16, borderRadius: 8 }}
      />
    </View>
  );

  // Render choice option item
  const renderChoiceItem = ({ item }: { item: ChoiceOption }) => (
    <TouchableOpacity
      style={[
        currentStyles.choiceItem,
        activeChoice === item.id && currentStyles.choiceItemActive
      ]}
      onPress={() => handleChoiceSelect(item.id)}
      activeOpacity={0.7}
    >
      <Surface style={currentStyles.choiceItemContent} elevation={1}>
        <Text style={[
          currentStyles.choiceItemText,
          activeChoice === item.id && currentStyles.choiceItemTextActive
        ]}>
          {item.label}
        </Text>
        {item.description && (
          <Text style={currentStyles.choiceItemDescription}>
            {item.description}
          </Text>
        )}
      </Surface>
    </TouchableOpacity>
  );

  // Render the slide choice menu if options are provided
  const renderSlideChoiceMenu = () => {
    if (choiceOptions.length === 0) return null;
    
    return (
      <View style={currentStyles.choiceContainer}>
        {choiceTitle && (
          <Text style={currentStyles.choiceTitle}>{choiceTitle}</Text>
        )}
        <FlatList
          ref={slideRef}
          data={choiceOptions}
          renderItem={renderChoiceItem}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={currentStyles.choiceList}
          decelerationRate="fast"
          snapToAlignment="center"
          snapToInterval={160} // Adjusted based on item width + padding
        />
        {/* Choice indicators */}
        <View style={currentStyles.indicatorContainer}>
          {choiceOptions.map((option) => (
            <View
              key={option.id}
              style={[
                currentStyles.indicator,
                activeChoice === option.id && currentStyles.indicatorActive
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  const content = loading ? (LoadingComponent || defaultLoadingComponent) : children;

  const mainContent = (
    <View style={currentStyles.mainContainer}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
        automaticallyAdjustKeyboardInsets={true}
        keyboardDismissMode="interactive"
        bounces={true}
        overScrollMode="auto"
      >
        {/* Render slide choice menu at the top */}
        {renderSlideChoiceMenu()}
        
        <View style={[currentStyles.contentWrapper, contentContainerStyle]}>
          {content}
        </View>
      </ScrollView>
    </View>
  );

  const wrappedContent = hideKeyboardAvoidingView ? (
    mainContent
  ) : (
    <KeyboardAvoidingView
      style={currentStyles.keyboardAvoidingView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      {mainContent}
    </KeyboardAvoidingView>
  );

  return (
    <BaseScreen title={title}>
      {wrappedContent}
      
      {submitting && (
        <Animated.View 
          style={[
            currentStyles.submittingOverlay,
            { 
              opacity: submitAnimation,
              pointerEvents: 'none' as const,
            }
          ]}
        >
          <View style={currentStyles.progressContainer}>
            <ProgressBar
              indeterminate
              style={currentStyles.progressBar}
              color={theme.colors.primary}
            />
          </View>
        </Animated.View>
      )}
    </BaseScreen>
  );
};

const styles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  contentWrapper: {
    padding: 16,
    paddingBottom: Platform.select({
      ios: 120,
      android: 80,
      default: 60,
    }),
  },
  loadingContainer: {
    padding: 16,
  },
  submittingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.scrim + 'CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    width: '80%',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  // Slide choice menu styles
  choiceContainer: {
    marginVertical: 16,
    paddingHorizontal: 8,
  },
  choiceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 8,
    color: theme.colors.onSurface,
  },
  choiceList: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  choiceItem: {
    width: 140,
    marginHorizontal: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  choiceItemActive: {
    transform: [{ scale: 1.05 }],
  },
  choiceItemContent: {
    padding: 16,
    borderRadius: 12,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    minHeight: 100,
  },
  choiceItemText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
  },
  choiceItemTextActive: {
    color: theme.colors.primary,
  },
  choiceItemDescription: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    color: theme.colors.onSurfaceVariant,
    opacity: 0.8,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.surfaceVariant,
    marginHorizontal: 4,
  },
  indicatorActive: {
    backgroundColor: theme.colors.primary,
    width: 16,
  },
});

export default FormScreen;