import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import db from "../../database/db";

type TopOutfitData = {
  id: number;
  name: string;
  wear_count: number;
  d_uri: string | null;
  t_uri: string | null;
  b_uri: string | null;
};

type TopItemData = {
  id: number;
  image_uri: string;
  category_id: number;
  wear_count: number;
};

export default function InsightsScreen() {
  const { theme } = useTheme();
  const [totalLogs, setTotalLogs] = useState<number>(0);
  const [topOutfits, setTopOutfits] = useState<TopOutfitData[]>([]);
  const [topItems, setTopItems] = useState<TopItemData[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadStatistics();
    }, []),
  );

  const loadStatistics = () => {
    try {
      const logsCountResult = db.getFirstSync<{ total: number }>(
        "SELECT COUNT(id) as total FROM outfit_logs",
      );
      setTotalLogs(logsCountResult?.total || 0);

      const topOutfitsQuery = `
        SELECT o.id, o.name, COUNT(l.id) as wear_count,
               d.image_uri AS d_uri, t.image_uri AS t_uri, b.image_uri AS b_uri
        FROM outfit_logs l
        JOIN outfits o ON l.outfit_id = o.id
        LEFT JOIN clothes d ON o.dress_id = d.id
        LEFT JOIN clothes t ON o.top_id = t.id
        LEFT JOIN clothes b ON o.bottom_id = b.id
        GROUP BY o.id
        ORDER BY wear_count DESC, o.id DESC
        LIMIT 3
      `;
      const outfitsResult = db.getAllSync<TopOutfitData>(topOutfitsQuery);
      setTopOutfits(outfitsResult);

      const topItemsQuery = `
        SELECT c.id, c.image_uri, c.category_id, COUNT(l.id) as wear_count
        FROM outfit_logs l
        JOIN outfits o ON l.outfit_id = o.id
        JOIN clothes c ON (
          c.id = o.top_id OR 
          c.id = o.bottom_id OR 
          c.id = o.dress_id OR 
          c.id = o.shoes_id OR 
          c.id = o.outerwear_id
        )
        GROUP BY c.id
        ORDER BY wear_count DESC
        LIMIT 5
      `;
      const itemsResult = db.getAllSync<TopItemData>(topItemsQuery);
      setTopItems(itemsResult);
    } catch (error) {
      console.error("Error loading insights:", error);
    }
  };

  const getPercentage = (count: number) => {
    if (totalLogs === 0) return 0;
    return Math.round((count / totalLogs) * 100);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: theme.card, borderBottomColor: theme.border },
        ]}
      >
        <Text style={[styles.title, { color: theme.text }]}>
          Wardrobe Insights
        </Text>
        <Text style={[styles.subtitle, { color: theme.subtext }]}>
          Your style, analyzed.
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View
          style={[
            styles.statCard,
            { backgroundColor: theme.primary, shadowColor: theme.primary },
          ]}
        >
          <Text style={styles.statNumber}>{totalLogs}</Text>
          <Text style={[styles.statLabel, { color: theme.background }]}>
            Total Outfits Logged
          </Text>
        </View>

        {totalLogs === 0 ? (
          <View
            style={[
              styles.emptyState,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.emptyText, { color: theme.text }]}>
              Not enough data yet.
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.subtext }]}>
              Log some outfits in your Diary to see your statistics!
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              🏆 Most Worn Outfits
            </Text>
            {topOutfits.map((outfit, index) => (
              <View
                key={outfit.id}
                style={[styles.topOutfitCard, { backgroundColor: theme.card }]}
              >
                <View
                  style={[styles.badge, { backgroundColor: theme.iconBtn }]}
                >
                  <Text style={[styles.badgeText, { color: theme.primary }]}>
                    #{index + 1} • Worn {outfit.wear_count} times
                  </Text>
                </View>
                <Text
                  style={[styles.topOutfitName, { color: theme.text }]}
                  numberOfLines={1}
                >
                  {outfit.name}
                </Text>

                <View style={styles.previewGrid}>
                  {outfit.d_uri && (
                    <Image
                      source={{ uri: outfit.d_uri }}
                      style={[
                        styles.previewImage,
                        { backgroundColor: theme.border },
                      ]}
                    />
                  )}
                  {outfit.t_uri && (
                    <Image
                      source={{ uri: outfit.t_uri }}
                      style={[
                        styles.previewImage,
                        { backgroundColor: theme.border },
                      ]}
                    />
                  )}
                  {outfit.b_uri && (
                    <Image
                      source={{ uri: outfit.b_uri }}
                      style={[
                        styles.previewImage,
                        { backgroundColor: theme.border },
                      ]}
                    />
                  )}
                </View>
              </View>
            ))}

            <Text
              style={[
                styles.sectionTitle,
                { color: theme.text, marginTop: 16 },
              ]}
            >
              🔥 Top 5 Favorite Pieces
            </Text>
            <View style={[styles.itemsCard, { backgroundColor: theme.card }]}>
              {topItems.map((item, index) => {
                const percentage = getPercentage(item.wear_count);
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.itemRow,
                      { borderBottomColor: theme.border },
                    ]}
                  >
                    <Text style={[styles.rankText, { color: theme.subtext }]}>
                      #{index + 1}
                    </Text>
                    <Image
                      source={{ uri: item.image_uri }}
                      style={[
                        styles.itemThumbnail,
                        { backgroundColor: theme.border },
                      ]}
                    />

                    <View style={styles.barContainer}>
                      <Text
                        style={[styles.itemStatsText, { color: theme.text }]}
                      >
                        Worn {item.wear_count} times ({percentage}%)
                      </Text>
                      <View
                        style={[
                          styles.barBackground,
                          { backgroundColor: theme.border },
                        ]}
                      >
                        <View
                          style={[
                            styles.barFill,
                            {
                              width: `${percentage}%`,
                              backgroundColor: theme.primary,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    elevation: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
    textAlign: "center",
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  statCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 32,
    elevation: 4,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  statNumber: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  statLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
    textTransform: "uppercase",
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  topOutfitCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    elevation: 2,
    alignItems: "center",
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  badgeText: {
    fontWeight: "bold",
    fontSize: 14,
  },
  topOutfitName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  previewGrid: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  previewImage: {
    width: 70,
    height: 90,
    borderRadius: 12,
  },
  itemsCard: {
    borderRadius: 24,
    padding: 20,
    elevation: 2,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    borderBottomWidth: 1,
    paddingBottom: 16,
  },
  rankText: {
    fontSize: 18,
    fontWeight: "bold",
    width: 30,
  },
  itemThumbnail: {
    width: 50,
    height: 65,
    borderRadius: 8,
    marginRight: 16,
  },
  barContainer: {
    flex: 1,
  },
  itemStatsText: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  barBackground: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 4,
  },
});