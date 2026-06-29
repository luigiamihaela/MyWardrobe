import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ThemedButton from "../../components/ThemedButton";
import ThemedCard from "../../components/ThemedCard";
import { useTheme } from "../../context/ThemeContext";
import db from "../../database/db";

const STYLE_QUOTES = [
  "One is never over-dressed or under-dressed with a Little Black Dress. - Karl Lagerfeld",
  "Fashions fade, style is eternal. - Yves Saint Laurent",
  "Elegance is not standing out, but being remembered. - Giorgio Armani",
  "I like my money right where I can see it…hanging in my closet. - Carrie Bradshaw",
  "I think there is beauty in everything. What 'normal' people perceive as ugly, I can usually see something of beauty in it. - Alexander McQueen",
  "Style is something each of us already has, all we need to do is find it. - Diane von Furstenberg",
  "Fashion is the armor to survive the reality of everyday life. - Bill Cunningham",
  "I don't design clothes. I design dreams. - Ralph Lauren",
  "How can you live the high life if you do not wear the high heels? - Sonia Rykiel",
  "In difficult times, fashion is always outrageous. - Elsa Schiaparelli",
];

const getWeatherIcon = (mainCondition: string) => {
  switch (mainCondition) {
    case "Clear":
      return "sunny";
    case "Clouds":
      return "partly-sunny";
    case "Rain":
    case "Drizzle":
      return "rainy";
    case "Thunderstorm":
      return "thunderstorm";
    case "Snow":
      return "snow";
    default:
      return "partly-sunny";
  }
};

const getOutfitSuggestion = (temp: number) => {
  if (temp >= 25) return "Hot weather, don't forget sun protection!";
  if (temp >= 20) return "Warm weather, perfect for a Tshirt!";
  if (temp >= 15) return "Ideal time for o thin jacket!";
  if (temp >= 5) return "It's pretty chilly, don't forget a coat!";
  return "It's winter outside, dress well!";
};

interface WeatherData {
  main: {
    temp: number;
  };
  weather: {
    main: string;
  }[];
}

export default function HomeScreen() {
  const router = useRouter();
  const { theme, isPink, toggleTheme } = useTheme();

  const [stats, setStats] = useState({ clothes: 0, outfits: 0 });
  const [username, setUsername] = useState("Stylist");
  const [quote, setQuote] = useState(STYLE_QUOTES[0]);
  const [ootd, setOotd] = useState<{ name: string; images: string[] } | null>(
    null,
  );

  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setWeatherLoading(false);
          console.log("Location permission denied.");
          return;
        }

        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const lat = location.coords.latitude;
        const lon = location.coords.longitude;

        const API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY;

        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`,
        );
        const data = await response.json();
        setWeatherData(data);
        setWeatherLoading(false);
      } catch (error) {
        setWeatherLoading(false);
        console.error("Error fetching weather data:", error);
      }
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const randomQuote =
        STYLE_QUOTES[Math.floor(Math.random() * STYLE_QUOTES.length)];
      setQuote(randomQuote);

      try {
        const clothesCount = db.getFirstSync<{ total: number }>(
          "SELECT COUNT(id) as total FROM clothes",
        );
        const outfitsCount = db.getFirstSync<{ total: number }>(
          "SELECT COUNT(id) as total FROM outfits",
        );
        const userRow = db.getFirstSync<{ username: string }>(
          "SELECT username FROM user_profile LIMIT 1",
        );

        setStats({
          clothes: clothesCount?.total || 0,
          outfits: outfitsCount?.total || 0,
        });

        if (userRow) setUsername(userRow.username);

        const now = new Date();
        const tzOffset = now.getTimezoneOffset() * 60000;
        const localISOTime = new Date(now.getTime() - tzOffset)
          .toISOString()
          .split("T")[0];

        const localToday = localISOTime;

        const ootdRow = db.getFirstSync<any>(
          `SELECT 
             o.name, 
             c_dress.image_uri as dress_img,
             c_top.image_uri as top_img,
             c_bottom.image_uri as bottom_img,
             c_shoes.image_uri as shoes_img,
             c_outerwear.image_uri as outerwear_img,
             c_hat.image_uri as hat_img,
             c_purse.image_uri as purse_img
           FROM outfit_logs c 
           JOIN outfits o ON c.outfit_id = o.id 
           LEFT JOIN clothes c_dress ON o.dress_id = c_dress.id
           LEFT JOIN clothes c_top ON o.top_id = c_top.id
           LEFT JOIN clothes c_bottom ON o.bottom_id = c_bottom.id
           LEFT JOIN clothes c_shoes ON o.shoes_id = c_shoes.id
           LEFT JOIN clothes c_outerwear ON o.outerwear_id = c_outerwear.id
           LEFT JOIN clothes c_hat ON o.hat_id = c_hat.id
           LEFT JOIN clothes c_purse ON o.purse_id = c_purse.id
           WHERE c.date LIKE ? 
           ORDER BY c.id DESC 
           LIMIT 1`,
          [`${localToday}%`],
        );

        if (ootdRow) {
          const allImages = [
            ootdRow.dress_img,
            ootdRow.top_img,
            ootdRow.bottom_img,
            ootdRow.shoes_img,
            ootdRow.outerwear_img,
            ootdRow.hat_img,
            ootdRow.purse_img,
          ].filter((img) => img != null);

          setOotd({ name: ootdRow.name, images: allImages });
        } else {
          setOotd(null);
        }
      } catch (error) {
        console.error("SQL error:", error);
        setOotd(null);
      }
      const fetchWeather = async () => {
        if (weatherData) return;

        try {
          let { status } = await Location.getForegroundPermissionsAsync();
          if (status !== "granted") {
            setWeatherLoading(false);
            return;
          }

          setWeatherLoading(true);
          let location = await Location.getCurrentPositionAsync({});
          const lat = location.coords.latitude;
          const lon = location.coords.longitude;
          const API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY;

          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`,
          );
          const data = await response.json();
          setWeatherData(data);
          setWeatherLoading(false);
        } catch (error) {
          setWeatherLoading(false);
          console.error("Error fetching weather data:", error);
        }
      };

      fetchWeather();
    }, [weatherData]),
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View style={{ flex: 1, marginRight: 16 }}>
          <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
            Hello, {username}!
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            style={[styles.themeToggle, { backgroundColor: theme.iconBtn }]}
            onPress={toggleTheme}
          >
            <Text style={styles.themeToggleText}>{isPink ? "🌸" : "🔷"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.themeToggle, { backgroundColor: theme.iconBtn }]}
            onPress={() => router.push("/settings")}
          >
            <Text style={styles.themeToggleText}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.statsRow}>
          <ThemedCard style={styles.statCard}>
            <Text style={[styles.statNumber, { color: theme.primary }]}>
              {stats.clothes}
            </Text>
            <Text style={styles.statLabel}>Items</Text>
          </ThemedCard>

          <ThemedCard style={styles.statCard}>
            <Text style={[styles.statNumber, { color: theme.primary }]}>
              {stats.outfits}
            </Text>
            <Text style={styles.statLabel}>Outfits</Text>
          </ThemedCard>
        </View>

        {weatherLoading ? (
          <View
            style={[
              styles.weatherWidget,
              { backgroundColor: theme.iconBtn, justifyContent: "center" },
            ]}
          >
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        ) : weatherData ? (
          <View
            style={[styles.weatherWidget, { backgroundColor: theme.iconBtn }]}
          >
            <Ionicons
              name={getWeatherIcon(weatherData.weather[0].main) as any}
              size={36}
              color={theme.primary}
            />
            <View style={styles.weatherTextContainer}>
              <Text style={[styles.weatherTitle, { color: theme.text }]}>
                {Math.round(weatherData.main.temp)}°C &{" "}
                {weatherData.weather[0].main}
              </Text>
              <Text style={[styles.weatherSub, { color: theme.subtext }]}>
                {getOutfitSuggestion(Math.round(weatherData.main.temp))}
              </Text>
            </View>
          </View>
        ) : null}

        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Outfit of the Day
        </Text>
        <ThemedCard style={styles.ootdCard}>
          {ootd ? (
            <View style={styles.ootdContentVertical}>
              <View style={styles.ootdHeader}>
                <Text style={styles.ootdBadge}>Scheduled for Today</Text>
                <Text style={[styles.ootdName, { color: theme.text }]}>
                  {ootd.name}
                </Text>
              </View>

              <View style={styles.ootdGallery}>
                {ootd.images.length > 0 ? (
                  ootd.images.map((imgUri, index) => (
                    <Image
                      key={index}
                      source={{ uri: imgUri }}
                      style={styles.ootdMiniItem}
                    />
                  ))
                ) : (
                  <View
                    style={[
                      styles.ootdPlaceholderImage,
                      { backgroundColor: theme.border },
                    ]}
                  >
                    <Ionicons
                      name="shirt-outline"
                      size={30}
                      color={theme.primary}
                    />
                  </View>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.ootdEmpty}>
              <Ionicons
                name="calendar-outline"
                size={40}
                color="#A0AEC0"
                style={{ marginBottom: 12 }}
              />
              <Text style={[styles.ootdEmptyTitle, { color: theme.text }]}>
                No outfit planned
              </Text>
              <Text style={styles.ootdEmptySub}>
                You haven't chosen what to wear today.
              </Text>
              <ThemedButton
                title="📅 Plan Your Outfit"
                onPress={() => router.push("/calendar")}
                variant="solid"
              />
            </View>
          )}
        </ThemedCard>

        <View style={styles.quoteContainer}>
          <Ionicons
            name="sparkles"
            size={20}
            color={theme.primary}
            style={{ marginBottom: 8 }}
          />
          <Text style={[styles.quoteText, { color: theme.subtext }]}>
            {quote}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
    elevation: 2,
  },
  welcomeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1A202C",
  },
  themeToggle: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: "center",
  },
  themeToggleText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1A202C",
  },
  scrollContent: {
    padding: 24,
    flexGrow: 1,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 16,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 20,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 14,
    color: "#718096",
    fontWeight: "500",
    marginTop: 4,
  },
  weatherWidget: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    marginBottom: 28,
  },
  weatherTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  weatherTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 2,
  },
  weatherSub: {
    fontSize: 13,
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  ootdCard: {
    padding: 0,
    overflow: "hidden",
    marginBottom: 32,
  },
  ootdContentVertical: {
    padding: 20,
  },
  ootdHeader: {
    marginBottom: 16,
  },
  ootdBadge: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#FFFFFF",
    backgroundColor: "#48BB78",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 8,
    overflow: "hidden",
  },
  ootdName: {
    fontSize: 20,
    fontWeight: "bold",
  },
  ootdGallery: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  ootdMiniItem: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: "#EDF2F7",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  ootdPlaceholderImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  ootdEmpty: {
    alignItems: "center",
    padding: 24,
  },
  ootdEmptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  ootdEmptySub: {
    fontSize: 14,
    color: "#718096",
    marginBottom: 16,
    textAlign: "center",
  },
  quoteContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginVertical: "auto",
  },
  quoteText: {
    fontSize: 15,
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "500",
  },
});
