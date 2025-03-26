'use client';

import { useState, useEffect } from 'react';
import { Cloud, CloudRain, CloudSnow, CloudSun, Sun, Wind, ChevronLeft, ChevronRight, Droplets, Umbrella } from 'lucide-react';
import styles from './Clima.module.css';

// Coordenadas de Punta Cana
const PUNTA_CANA_LAT = 18.5601;
const PUNTA_CANA_LON = -68.3725;

type WeatherDay = {
  date: Date;
  temp: {
    day: number;
    min: number;
    max: number;
  };
  weather: {
    main: string;
    description: string;
    icon: string;
  };
  humidity: number;
  windSpeed: number;
  chanceOfRain: number;
  uvi: number;
};

const Clima = () => {
  const [weatherData, setWeatherData] = useState<WeatherDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startIndex, setStartIndex] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);

  // Determinar cuántos días mostrar según el ancho de la ventana
  const daysToShow = viewportWidth < 640 ? 3 : viewportWidth < 1024 ? 5 : 7;

  useEffect(() => {
    // Actualizar el ancho del viewport
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    // Establecer el ancho inicial
    handleResize();

    // Escuchar cambios de tamaño
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Modificar la función fetchWeatherData
    const fetchWeatherData = async () => {
      try {
        setLoading(true);
        // Open-Meteo es completamente gratuito y no requiere API key
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${PUNTA_CANA_LAT}&longitude=${PUNTA_CANA_LON}&daily=weathercode,temperature_2m_max,temperature_2m_min,apparent_temperature_max,precipitation_probability_max,windspeed_10m_max,uv_index_max&timezone=auto`
        );
    
        if (!response.ok) {
          throw new Error('Failed to fetch weather data');
        }
    
        const data = await response.json();
        
        // Transformar los datos para nuestro uso
        const transformedData: WeatherDay[] = data.daily.time.map((time: string, index: number) => {
          // Convertir código WMO a formato compatible con nuestros iconos
          const weatherCode = data.daily.weathercode[index];
          let weatherMain = 'Clear';
          
          if (weatherCode >= 0 && weatherCode <= 3) {
            weatherMain = 'Clear';
          } else if (weatherCode >= 45 && weatherCode <= 48) {
            weatherMain = 'Clouds';
          } else if ((weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 99)) {
            weatherMain = 'Rain';
          } else if (weatherCode >= 71 && weatherCode <= 77) {
            weatherMain = 'Snow';
          }
          
          return {
            date: new Date(time),
            temp: {
              day: Math.round(data.daily.apparent_temperature_max[index]),
              min: Math.round(data.daily.temperature_2m_min[index]),
              max: Math.round(data.daily.temperature_2m_max[index]),
            },
            weather: {
              main: weatherMain,
              description: weatherMain.toLowerCase(),
              icon: weatherMain === 'Clear' ? '01d' : 
                    weatherMain === 'Clouds' ? '03d' : 
                    weatherMain === 'Rain' ? '10d' : '13d',
            },
            humidity: 75, // No proporcionado directamente, usando valor promedio
            windSpeed: data.daily.windspeed_10m_max[index],
            chanceOfRain: data.daily.precipitation_probability_max[index] || 0,
            uvi: data.daily.uv_index_max[index],
          };
        });
    
        setWeatherData(transformedData);
        setError(null);
      } catch (err) {
        console.error('Error fetching weather data:', err);
        setError('No pudimos cargar el pronóstico del tiempo. Usando datos típicos.');
        generarDatosMockPuntaCana();
      } finally {
        setLoading(false);
      }
    };

    // Función para generar datos de muestra basados en la climatología real de Punta Cana
    const generarDatosMockPuntaCana = () => {
      // Datos climáticos promedios para Punta Cana por mes
      const climaPorMes = [
        {mes: 0, tempDia: 28, tempMin: 21, tempMax: 29, lluvia: 15}, // Enero
        {mes: 1, tempDia: 28, tempMin: 21, tempMax: 29, lluvia: 13}, // Febrero
        {mes: 2, tempDia: 29, tempMin: 21, tempMax: 30, lluvia: 15}, // Marzo
        {mes: 3, tempDia: 29, tempMin: 22, tempMax: 31, lluvia: 18}, // Abril
        {mes: 4, tempDia: 30, tempMin: 23, tempMax: 31, lluvia: 25}, // Mayo
        {mes: 5, tempDia: 31, tempMin: 24, tempMax: 32, lluvia: 30}, // Junio
        {mes: 6, tempDia: 31, tempMin: 24, tempMax: 32, lluvia: 25}, // Julio
        {mes: 7, tempDia: 31, tempMin: 24, tempMax: 32, lluvia: 30}, // Agosto
        {mes: 8, tempDia: 31, tempMin: 24, tempMax: 32, lluvia: 35}, // Septiembre
        {mes: 9, tempDia: 30, tempMin: 23, tempMax: 31, lluvia: 40}, // Octubre
        {mes: 10, tempDia: 29, tempMin: 23, tempMax: 30, lluvia: 30}, // Noviembre
        {mes: 11, tempDia: 28, tempMin: 22, tempMax: 29, lluvia: 20}, // Diciembre
      ];
      
      const mockData: WeatherDay[] = Array.from({ length: 14 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i);
        
        const mes = date.getMonth();
        const datosDelMes = climaPorMes[mes];
        
        // Agregar variaciones aleatorias para hacerlo más realista
        const variacionTemp = Math.random() * 2 - 1; // -1 a +1
        const esLluvioso = Math.random() * 100 < datosDelMes.lluvia;
        
        return {
          date,
          temp: {
            day: Math.round(datosDelMes.tempDia + variacionTemp),
            min: Math.round(datosDelMes.tempMin + variacionTemp),
            max: Math.round(datosDelMes.tempMax + variacionTemp),
          },
          weather: {
            main: esLluvioso ? 'Rain' : Math.random() > 0.7 ? 'Clouds' : 'Clear',
            description: esLluvioso ? 'lluvia ligera' : 'cielo despejado',
            icon: esLluvioso ? '10d' : '01d',
          },
          humidity: Math.round(75 + Math.random() * 10),
          windSpeed: Math.round((15 + Math.random() * 10) * 10) / 10,
          chanceOfRain: esLluvioso ? 70 + Math.floor(Math.random() * 30) : Math.floor(Math.random() * datosDelMes.lluvia),
          uvi: Math.round(8 + Math.random() * 3),
        };
      });
      
      setWeatherData(mockData);
    };

    fetchWeatherData();
  }, []);

  const getWeatherIcon = (main: string) => {
    switch (main) {
      case 'Clear':
        return <Sun size={32} className={styles.sunIcon} />;
      case 'Clouds':
        return <CloudSun size={32} className={styles.cloudSunIcon} />;
      case 'Rain':
        return <CloudRain size={32} className={styles.rainIcon} />;
      case 'Snow':
        return <CloudSnow size={32} className={styles.snowIcon} />;
      default:
        return <Cloud size={32} className={styles.cloudIcon} />;
    }
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      day: 'numeric',
      month: 'short' 
    };
    return date.toLocaleDateString('es-ES', options);
  };

  const nextDays = () => {
    if (startIndex + daysToShow < weatherData.length) {
      setStartIndex(startIndex + 1);
    }
  };

  const prevDays = () => {
    if (startIndex > 0) {
      setStartIndex(startIndex - 1);
    }
  };

  // Renderizar elementos de animación climática
  const renderWeatherElements = (weather: string) => {
    switch (weather) {
      case 'Clear':
        return (
          <div className={styles.sunnyElements}>
            <div className={styles.sunRays}></div>
            <div className={styles.warmGlow}></div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={styles.sunBeam} style={{ animationDelay: `${i * 0.2}s` }}></div>
            ))}
          </div>
        );
      case 'Rain':
        return (
          <div className={styles.rainyElements}>
            {Array.from({ length: 20 }).map((_, i) => (
              <div 
                key={i} 
                className={styles.raindrop} 
                style={{ 
                  left: `${Math.random() * 100}%`, 
                  animationDuration: `${0.7 + Math.random() * 0.6}s`,
                  animationDelay: `${Math.random() * 1.5}s`
                }}
              ></div>
            ))}
          </div>
        );
      case 'Clouds':
        return (
          <div className={styles.cloudyElements}>
            <div className={styles.cloud1}></div>
            <div className={styles.cloud2}></div>
            <div className={styles.cloud3}></div>
          </div>
        );
      case 'Snow':
        return (
          <div className={styles.snowyElements}>
            {Array.from({ length: 30 }).map((_, i) => (
              <div 
                key={i} 
                className={styles.snowflake} 
                style={{ 
                  left: `${Math.random() * 100}%`, 
                  animationDuration: `${5 + Math.random() * 5}s`,
                  animationDelay: `${Math.random() * 3}s`
                }}
              ></div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  const visibleDays = weatherData.slice(startIndex, startIndex + daysToShow);

  return (
    <div className={styles.climaContainer}>
      <div className={styles.climaHeader}>
        <h2>Clima en Punta Cana</h2>
        <div className={styles.controls}>
          <button 
            onClick={prevDays} 
            disabled={startIndex === 0}
            className={`${styles.controlButton} ${startIndex === 0 ? styles.disabled : ''}`}
          >
            <ChevronLeft size={20} />
          </button>
          <span className={styles.daysRange}>
            {startIndex + 1}-{Math.min(startIndex + daysToShow, weatherData.length)} de {weatherData.length} días
          </span>
          <button 
            onClick={nextDays} 
            disabled={startIndex + daysToShow >= weatherData.length}
            className={`${styles.controlButton} ${startIndex + daysToShow >= weatherData.length ? styles.disabled : ''}`}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Cargando pronóstico del tiempo...</p>
        </div>
      ) : error ? (
        <div className={styles.errorContainer}>
          <p>{error}</p>
        </div>
      ) : (
        <div className={styles.weatherCards}>
          {visibleDays.map((day, index) => (
            <div 
              key={index} 
              className={`${styles.weatherCard} ${styles[`weather${day.weather.main}`]}`}
            >
              {renderWeatherElements(day.weather.main)}
              <div className={styles.contentWrapper}>
                <div className={styles.dateHeader}>
                  {formatDate(day.date)}
                </div>
                <div className={styles.weatherIcon}>
                  {getWeatherIcon(day.weather.main)}
                </div>
                <div className={styles.temperatures}>
                  <span className={styles.mainTemp}>{day.temp.day}°C</span>
                  <div className={styles.minMaxTemp}>
                    <span className={styles.maxTemp}>{day.temp.max}°</span>
                    <span className={styles.minTemp}>{day.temp.min}°</span>
                  </div>
                </div>
                <div className={styles.weatherCondition}>
                  {day.weather.main === 'Rain' && <Umbrella size={14} className={styles.conditionIcon} />}
                  {day.weather.description}
                </div>
                <div className={styles.weatherDetails}>
                  <div className={styles.detailItem}>
                    <Droplets size={14} className={styles.detailIcon} />
                    <span>{day.humidity}%</span>
                  </div>
                  <div className={styles.detailItem}>
                    <Wind size={14} className={styles.detailIcon} />
                    <span>{day.windSpeed} km/h</span>
                  </div>
                  <div className={styles.detailItem}>
                    <CloudRain size={14} className={styles.detailIcon} />
                    <span>{Math.round(day.chanceOfRain)}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Clima;