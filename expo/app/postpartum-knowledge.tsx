import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  Search,
  X,
  ChevronDown,
  ChevronUp,
  BookOpen,
  AlertTriangle,
  Heart,
} from 'lucide-react-native';
import Colors from '../constants/colors';
import { POSTPARTUM_FAQ, FAQ_CATEGORIES, searchFAQ } from '../mocks/postpartum-faq';
import { getRelevantArticles } from '../mocks/postpartum-articles';
import { usePregnancyStore } from '../store/pregnancy-store';
import * as Haptics from 'expo-haptics';

type TabType = 'faq' | 'articles';

export default function PostpartumKnowledgeScreen() {
  const _router = useRouter();
  const { postpartumProfile, getWeeksPostpartum } = usePregnancyStore();
  const weeksPostpartum = getWeeksPostpartum();
  const deliveryType = postpartumProfile?.deliveryType ?? 'vaginal';

  const [activeTab, setActiveTab] = useState<TabType>('faq');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  useEffect(() => {
    Animated.spring(tabIndicatorAnim, {
      toValue: activeTab === 'faq' ? 0 : 1,
      tension: 80,
      friction: 12,
      useNativeDriver: false,
    }).start();
  }, [activeTab, tabIndicatorAnim]);

  const filteredFAQs = useMemo(() => {
    let results = searchQuery.length > 1
      ? searchFAQ(searchQuery, deliveryType)
      : POSTPARTUM_FAQ.filter(faq => {
          const effectiveType = deliveryType === 'vbac' ? 'vaginal' : deliveryType;
          return faq.deliverySpecific === 'all' || faq.deliverySpecific === effectiveType;
        });

    if (selectedCategory !== 'all') {
      results = results.filter(faq => faq.category === selectedCategory);
    }

    return results;
  }, [searchQuery, selectedCategory, deliveryType]);

  const filteredArticles = useMemo(() => {
    let results = getRelevantArticles(weeksPostpartum, deliveryType, true);

    if (searchQuery.length > 1) {
      const lower = searchQuery.toLowerCase();
      results = results.filter(a =>
        a.title.toLowerCase().includes(lower) ||
        a.summary.toLowerCase().includes(lower) ||
        a.tags.some(t => t.toLowerCase().includes(lower))
      );
    }

    if (selectedCategory !== 'all') {
      results = results.filter(a => a.category === selectedCategory);
    }

    return results;
  }, [weeksPostpartum, deliveryType, searchQuery, selectedCategory]);

  const handleTabChange = useCallback((tab: TabType) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveTab(tab);
    setExpandedFaqId(null);
    setExpandedArticleId(null);
  }, []);

  const handleFaqToggle = useCallback((id: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setExpandedFaqId(prev => prev === id ? null : id);
  }, []);

  const handleArticleToggle = useCallback((id: string) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setExpandedArticleId(prev => prev === id ? null : id);
  }, []);

  const tabIndicatorLeft = tabIndicatorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '50%'],
  });

  const articleCategories = [
    { id: 'all' as const, label: 'All', emoji: '📚' },
    { id: 'physical' as const, label: 'Physical', emoji: '🩺' },
    { id: 'emotional' as const, label: 'Emotional', emoji: '💙' },
    { id: 'baby_care' as const, label: 'Baby Care', emoji: '👶' },
    { id: 'relationships' as const, label: 'Relationships', emoji: '💑' },
    { id: 'nutrition' as const, label: 'Nutrition', emoji: '🥗' },
    { id: 'exercise' as const, label: 'Exercise', emoji: '💪' },
  ];

  const categories = activeTab === 'faq' ? FAQ_CATEGORIES : articleCategories;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Knowledge Base' }} />
      <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>
        <View style={styles.tabBar}>
          <Animated.View style={[styles.tabIndicator, { left: tabIndicatorLeft }]} />
          <TouchableOpacity
            style={styles.tabBtn}
            onPress={() => handleTabChange('faq')}
            activeOpacity={0.7}
            testID="tab-faq"
          >
            <Text style={[styles.tabText, activeTab === 'faq' && styles.tabTextActive]}>
              Q&A
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tabBtn}
            onPress={() => handleTabChange('articles')}
            activeOpacity={0.7}
            testID="tab-articles"
          >
            <Text style={[styles.tabText, activeTab === 'articles' && styles.tabTextActive]}>
              Articles
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Search size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={activeTab === 'faq' ? 'Search questions...' : 'Search articles...'}
            placeholderTextColor={Colors.textLight}
            testID="search-input"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContent}
        >
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryChip, selectedCategory === cat.id && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(cat.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
              <Text style={[styles.categoryLabel, selectedCategory === cat.id && styles.categoryLabelActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {weeksPostpartum > 0 && (
            <View style={styles.contextBadge}>
              <Heart size={14} color={Colors.primary} />
              <Text style={styles.contextText}>
                Showing content relevant to week {weeksPostpartum} postpartum
                {deliveryType !== 'vaginal' ? ` (${deliveryType === 'c_section' ? 'C-section' : 'VBAC'})` : ''}
              </Text>
            </View>
          )}

          {activeTab === 'faq' && (
            <>
              {filteredFAQs.length === 0 ? (
                <View style={styles.emptyState}>
                  <BookOpen size={40} color={Colors.textLight} />
                  <Text style={styles.emptyTitle}>No results found</Text>
                  <Text style={styles.emptySubtitle}>Try different keywords or change the category filter</Text>
                </View>
              ) : (
                filteredFAQs.map(faq => {
                  const isExpanded = expandedFaqId === faq.id;
                  return (
                    <TouchableOpacity
                      key={faq.id}
                      style={[styles.faqCard, isExpanded && styles.faqCardExpanded]}
                      onPress={() => handleFaqToggle(faq.id)}
                      activeOpacity={0.7}
                      testID={`faq-${faq.id}`}
                    >
                      <View style={styles.faqHeader}>
                        <Text style={styles.faqEmoji}>{faq.emoji}</Text>
                        <Text style={styles.faqQuestion}>{faq.question}</Text>
                        {isExpanded ? (
                          <ChevronUp size={18} color={Colors.textMuted} />
                        ) : (
                          <ChevronDown size={18} color={Colors.textMuted} />
                        )}
                      </View>
                      {isExpanded && (
                        <View style={styles.faqBody}>
                          <Text style={styles.faqAnswer}>{faq.answer}</Text>
                          <View style={styles.faqTags}>
                            {faq.tags.map(tag => (
                              <View key={tag} style={styles.tag}>
                                <Text style={styles.tagText}>{tag}</Text>
                              </View>
                            ))}
                          </View>
                          {faq.deliverySpecific !== 'all' && (
                            <View style={styles.specificBadge}>
                              <Text style={styles.specificText}>
                                {faq.deliverySpecific === 'c_section' ? 'C-Section specific' : 'Vaginal delivery specific'}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </>
          )}

          {activeTab === 'articles' && (
            <>
              {filteredArticles.length === 0 ? (
                <View style={styles.emptyState}>
                  <BookOpen size={40} color={Colors.textLight} />
                  <Text style={styles.emptyTitle}>No articles found</Text>
                  <Text style={styles.emptySubtitle}>Try different keywords or change the category filter</Text>
                </View>
              ) : (
                filteredArticles.map(article => {
                  const isExpanded = expandedArticleId === article.id;
                  return (
                    <TouchableOpacity
                      key={article.id}
                      style={[styles.articleCard, isExpanded && styles.articleCardExpanded]}
                      onPress={() => handleArticleToggle(article.id)}
                      activeOpacity={0.7}
                      testID={`article-${article.id}`}
                    >
                      <View style={styles.articleHeader}>
                        <Text style={styles.articleEmoji}>{article.emoji}</Text>
                        <View style={styles.articleHeaderText}>
                          <Text style={styles.articleTitle}>{article.title}</Text>
                          <Text style={styles.articleSummary}>{article.summary}</Text>
                          <View style={styles.articleMeta}>
                            <View style={styles.articleMetaChip}>
                              <Text style={styles.articleMetaText}>{article.category.replace('_', ' ')}</Text>
                            </View>
                            {article.deliveryType !== 'all' && (
                              <View style={[styles.articleMetaChip, styles.articleMetaChipHighlight]}>
                                <Text style={styles.articleMetaTextHighlight}>
                                  {article.deliveryType === 'c_section' ? 'C-Section' : 'Vaginal'}
                                </Text>
                              </View>
                            )}
                            {article.forPartner && (
                              <View style={[styles.articleMetaChip, styles.articleMetaChipPartner]}>
                                <Text style={styles.articleMetaTextPartner}>Partner</Text>
                              </View>
                            )}
                          </View>
                        </View>
                        {isExpanded ? (
                          <ChevronUp size={18} color={Colors.textMuted} />
                        ) : (
                          <ChevronDown size={18} color={Colors.textMuted} />
                        )}
                      </View>
                      {isExpanded && (
                        <View style={styles.articleBody}>
                          <Text style={styles.articleContent}>{article.body}</Text>
                          <View style={styles.articleRelevance}>
                            <Text style={styles.articleRelevanceText}>
                              Relevant: weeks {article.relevantWeeks.min}–{article.relevantWeeks.max} postpartum
                            </Text>
                          </View>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </>
          )}

          <View style={styles.disclaimer}>
            <AlertTriangle size={14} color={Colors.textLight} />
            <Text style={styles.disclaimerText}>
              This information is general in nature and not a substitute for professional medical advice. Always consult your healthcare provider for concerns about your health.
            </Text>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  inner: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: Colors.muted,
    borderRadius: 12,
    padding: 3,
    position: 'relative' as const,
  },
  tabIndicator: {
    position: 'absolute' as const,
    top: 3,
    width: '50%',
    height: '100%',
    backgroundColor: Colors.card,
    borderRadius: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      },
    }),
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center' as const,
    zIndex: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    padding: 0,
  },
  categoryScroll: {
    maxHeight: 44,
    marginTop: 12,
  },
  categoryContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '12',
  },
  categoryEmoji: {
    fontSize: 14,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  categoryLabelActive: {
    color: Colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  contextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary + '10',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  contextText: {
    flex: 1,
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center' as const,
  },
  faqCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 10,
  },
  faqCardExpanded: {
    borderColor: Colors.primary + '40',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  faqEmoji: {
    fontSize: 20,
    marginTop: 1,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    lineHeight: 22,
  },
  faqBody: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  faqAnswer: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 22,
  },
  faqTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  tag: {
    backgroundColor: Colors.muted,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 11,
    color: Colors.textLight,
  },
  specificBadge: {
    alignSelf: 'flex-start' as const,
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 8,
  },
  specificText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#92400E',
  },
  articleCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 10,
  },
  articleCardExpanded: {
    borderColor: Colors.accent + '40',
  },
  articleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  articleEmoji: {
    fontSize: 28,
    marginTop: 2,
  },
  articleHeaderText: {
    flex: 1,
  },
  articleTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  articleSummary: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 19,
    marginBottom: 8,
  },
  articleMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  articleMetaChip: {
    backgroundColor: Colors.muted,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  articleMetaText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textLight,
    textTransform: 'capitalize' as const,
  },
  articleMetaChipHighlight: {
    backgroundColor: '#FEF3C7',
  },
  articleMetaTextHighlight: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#92400E',
  },
  articleMetaChipPartner: {
    backgroundColor: '#EDE9FE',
  },
  articleMetaTextPartner: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#6D28D9',
  },
  articleBody: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  articleContent: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 22,
  },
  articleRelevance: {
    marginTop: 14,
    backgroundColor: Colors.muted,
    borderRadius: 8,
    padding: 10,
  },
  articleRelevanceText: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '500' as const,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 16,
    padding: 14,
    backgroundColor: Colors.muted,
    borderRadius: 10,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: Colors.textLight,
    lineHeight: 17,
  },
});
