import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, BookOpen, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react-native';
import Colors from '../constants/colors';
import { PERIMENOPAUSE_EDUCATION_ARTICLES } from '../types/perimenopause';

const CATEGORIES = ['All', 'Basics', 'Symptoms', 'Science', 'Wellness', 'Health'];

export default function PerimenopauseEducationScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

  const filtered = PERIMENOPAUSE_EDUCATION_ARTICLES.filter(
    a => selectedCategory === 'All' || a.category === selectedCategory
  );

  const toggleArticle = (id: string) => {
    setExpandedArticle(prev => (prev === id ? null : id));
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        title: 'Education',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
            <ArrowLeft size={22} color={Colors.text} />
          </TouchableOpacity>
        ),
      }} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerIconWrap}>
            <BookOpen size={28} color="#7C3AED" />
          </View>
          <Text style={styles.headerTitle}>Perimenopause Knowledge Base</Text>
          <Text style={styles.headerSubtitle}>
            Evidence-based articles to help you understand and navigate this stage of life.
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filtered.map(article => {
          const isExpanded = expandedArticle === article.id;
          return (
            <TouchableOpacity
              key={article.id}
              style={[styles.articleCard, isExpanded && styles.articleCardExpanded]}
              onPress={() => toggleArticle(article.id)}
              activeOpacity={0.8}
            >
              <View style={styles.articleHeader}>
                <Text style={styles.articleEmoji}>{article.emoji}</Text>
                <View style={styles.articleMeta}>
                  <Text style={styles.articleTitle}>{article.title}</Text>
                  <Text style={styles.articleSummary}>{article.summary}</Text>
                  <View style={styles.articleCategoryBadge}>
                    <Text style={styles.articleCategoryText}>{article.category}</Text>
                  </View>
                </View>
                {isExpanded ? (
                  <ChevronUp size={18} color={Colors.textLight} />
                ) : (
                  <ChevronDown size={18} color={Colors.textLight} />
                )}
              </View>

              {isExpanded && (
                <View style={styles.articleContent}>
                  <View style={styles.divider} />
                  <Text style={styles.articleBody}>{article.content}</Text>
                  <View style={styles.disclaimerBox}>
                    <Text style={styles.disclaimerText}>
                      This information is for educational purposes only and is not a substitute for professional medical advice. Always consult your healthcare provider.
                    </Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        <View style={styles.footerCard}>
          <Text style={styles.footerTitle}>Need Personalized Advice?</Text>
          <Text style={styles.footerText}>
            Every woman's perimenopause journey is unique. Consider speaking with a healthcare provider who specializes in menopause management.
          </Text>
          <TouchableOpacity
            style={styles.footerButton}
            onPress={() => router.push('/telehealth' as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.footerButtonText}>Find a Specialist</Text>
            <ChevronRight size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EDE9FE',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  categoryScroll: {
    marginBottom: 16,
    maxHeight: 36,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#7C3AED',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  categoryTextActive: {
    color: '#7C3AED',
  },
  articleCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 10,
  },
  articleCardExpanded: {
    borderColor: '#7C3AED' + '40',
  },
  articleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  articleEmoji: {
    fontSize: 28,
    marginRight: 12,
    marginTop: 2,
  },
  articleMeta: {
    flex: 1,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  articleSummary: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
    marginBottom: 6,
  },
  articleCategoryBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  articleCategoryText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#7C3AED',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  articleContent: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 14,
  },
  articleBody: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
  disclaimerBox: {
    marginTop: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  disclaimerText: {
    fontSize: 11,
    color: '#92400E',
    lineHeight: 16,
    fontStyle: 'italic' as const,
  },
  footerCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    padding: 20,
    marginTop: 12,
    alignItems: 'center',
  },
  footerTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  footerText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 14,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary + '12',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
});
