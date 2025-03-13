'use client';

import { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';
import { PlusCircle, Calendar, Plane, Umbrella, CheckCircle2, CircleDashed, Sun, Palmtree, Package, Heart, Camera, Coffee, Utensils } from "lucide-react";
import styles from "./page.module.css";
import './globals.css';

// Inicializar cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Definición del tipo Tarea
type Tarea = {
  id: string;
  titulo: string;
  descripcion: string;
  icono: string;
  completada: boolean;
  prioridad: number;
  fecha_limite?: string;
};

// Iconos disponibles para tareas
const iconos = {
  avion: <Plane size={20} />,
  sombrilla: <Umbrella size={20} />,
  sol: <Sun size={20} />,
  palmera: <Palmtree size={20} />,
  paquete: <Package size={20} />,
  corazon: <Heart size={20} color="#9EB7E5" />, // Color fijo en lugar de usar getComputedStyle
  camara: <Camera size={20} />,
  cafe: <Coffee size={20} />,
  comida: <Utensils size={20} />
};


export default function Home() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [nuevaTarea, setNuevaTarea] = useState<Partial<Tarea>>({
    titulo: '',
    descripcion: '',
    icono: 'avion',
    prioridad: 1,
  });
  const [completadasCount, setCompletadasCount] = useState(0);
  const [agregandoTarea, setAgregandoTarea] = useState(false);
  const [iconoSeleccionado, setIconoSeleccionado] = useState('avion');
  const [fechaViaje] = useState(new Date(2025, 2, 31)); // Fecha viaje: 31 de marzo de 2025

  // Cargar tareas desde Supabase
  useEffect(() => {
    async function cargarTareas() {
      try {
        const { data, error } = await supabase
          .from('tareas')
          .select('*');
        
        if (error) throw error;
        if (data) {
          // Adaptar los nombres de campos de inglés a español
          const tareasAdaptadas = data.map(item => ({
            id: item.id,
            titulo: item.title,
            descripcion: item.description,
            icono: item.icon,
            completada: item.is_completed,
            prioridad: item.priority,
            fecha_limite: item.due_date
          }));
          
          // Ordenar tareas: primero incompletas por prioridad, luego completas
          const tareasOrdenadas = ordenarTareas(tareasAdaptadas);
          setTareas(tareasOrdenadas);
          setCompletadasCount(tareasAdaptadas.filter(tarea => tarea.completada).length);
        }
      } catch (error) {
        console.error('Error cargando tareas:', error);
    
      }
    }
    
    cargarTareas();
  }, []);

  // Ordenar tareas: incompletas primero (por prioridad), luego completadas
  const ordenarTareas = (tareas: Tarea[]) => {
    return [...tareas].sort((a, b) => {
      // Primero ordenar por estado completado
      if (a.completada !== b.completada) {
        return a.completada ? 1 : -1;
      }
      // Si ambas tienen el mismo estado, ordenar por prioridad (mayor primero)
      return b.prioridad - a.prioridad;
    });
  };

  // Cambiar estado de completado de tarea
  const cambiarEstadoTarea = async (id: string) => {
    const indice = tareas.findIndex(t => t.id === id);
    if (indice >= 0) {
      const tareasActualizadas = [...tareas];
      tareasActualizadas[indice].completada = !tareasActualizadas[indice].completada;
      
      // Reordenar las tareas
      const tareasOrdenadas = ordenarTareas(tareasActualizadas);
      setTareas(tareasOrdenadas);
      setCompletadasCount(tareasOrdenadas.filter(tarea => tarea.completada).length);
      
      try {
        await supabase
          .from('tareas')
          .update({ is_completed: tareasActualizadas[indice].completada })
          .eq('id', id);
      } catch (error) {
        console.error('Error actualizando tarea:', error);
      }
    }
  };

  // Agregar nueva tarea
  const agregarTarea = async () => {
    if (!nuevaTarea.titulo) return;
    
    try {
      const tareaParaAgregar = {
        title: nuevaTarea.titulo,
        description: nuevaTarea.descripcion,
        icon: nuevaTarea.icono,
        priority: nuevaTarea.prioridad,
        is_completed: false
      };
      
      const { data, error } = await supabase
        .from('tareas')
        .insert(tareaParaAgregar)
        .select();
        
      if (error) throw error;
      
      if (data) {
        // Adaptar los campos al español
        const tareaInsertada = {
          id: data[0].id,
          titulo: data[0].title,
          descripcion: data[0].description,
          icono: data[0].icon,
          completada: data[0].is_completed,
          prioridad: data[0].priority
        };
        const nuevasTareas = ordenarTareas([...tareas, tareaInsertada]);
        setTareas(nuevasTareas);
      } else {
        // Alternativa para demo
        const tareaDemostracion = {
          ...nuevaTarea,
          id: Date.now().toString(),
          completada: false
        } as Tarea;
        const nuevasTareas = ordenarTareas([...tareas, tareaDemostracion]);
        setTareas(nuevasTareas);
      }
      
      // Reiniciar formulario
      setNuevaTarea({
        titulo: '',
        descripcion: '',
        icono: 'avion',
        prioridad: 1,
      });
      setAgregandoTarea(false);
    } catch (error) {
      console.error('Error agregando tarea:', error);
      // Agregar localmente si falla Supabase
      const tareaDemostracion = {
        ...nuevaTarea,
        id: Date.now().toString(),
        completada: false,
      } as Tarea;
      const nuevasTareas = ordenarTareas([...tareas, tareaDemostracion]);
      setTareas(nuevasTareas);
      setAgregandoTarea(false);
    }
  };

  // Eliminar una tarea
  const eliminarTarea = async (id: string) => {
    try {
      await supabase
        .from('tareas')
        .delete()
        .eq('id', id);
        
      const tareasActualizadas = tareas.filter(tarea => tarea.id !== id);
      setTareas(tareasActualizadas);
      setCompletadasCount(tareasActualizadas.filter(tarea => tarea.completada).length);
    } catch (error) {
      console.error('Error eliminando tarea:', error);
      // Eliminar localmente si falla Supabase
      const tareasActualizadas = tareas.filter(tarea => tarea.id !== id);
      setTareas(tareasActualizadas);
      setCompletadasCount(tareasActualizadas.filter(tarea => tarea.completada).length);
    }
  };

  // Calcular días restantes
  const calcularDiasRestantes = () => {
    const hoy = new Date();
    const tiempoDiferencia = fechaViaje.getTime() - hoy.getTime();
    const diasRestantes = Math.ceil(tiempoDiferencia / (1000 * 60 * 60 * 24));
    return diasRestantes > 0 ? diasRestantes : 0;
  };

  // Fecha formateada en español
  const formatearFecha = (fecha: Date) => {
    const opciones: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    return fecha.toLocaleDateString('es-ES', opciones);
  };

  return (
    <div className={styles.page}>
      <div className={styles.bgOverlay}></div>
      
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Aventura en Punta Cana</h1>
          <h2 className={styles.headerSubtitle}>Facu & Cande</h2>
        </div>
      </header>

      <div className={styles.countdownContainer}>
        <div className={styles.countdownCard}>
          <div className={styles.countdownHeader}>
            <Calendar size={32} color="var(--jordy-blue)" />
            <h3>Cuenta regresiva para nuestro viaje</h3>
          </div>
          <div className={styles.countdownValue}>
            {calcularDiasRestantes()}
          </div>
          <div className={styles.countdownText}>
            días hasta el {formatearFecha(fechaViaje)}
          </div>
          <div className={styles.countdownProgress}>
            <div 
              className={styles.countdownProgressFill} 
              style={{ 
                width: `${Math.max(0, Math.min(100, 100 - (calcularDiasRestantes() / 365 * 100)))}%` 
              }}
            ></div>
          </div>
        </div>
      </div>

      <main className={styles.main}>
        <div className={styles.progressContainer}>
          <div className={styles.progressInfo}>
            <h2>Progreso de preparativos</h2>
            <span>{completadasCount} de {tareas.length} tareas completadas</span>
          </div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ 
                width: `${tareas.length > 0 ? (completadasCount / tareas.length) * 100 : 0}%`,
                backgroundColor: tareas.length > 0 && completadasCount === tareas.length ? '#4CAF50' : 'var(--sage)' 
              }}
            ></div>
          </div>
        </div>

        <div className={styles.addTaskSection}>
          {!agregandoTarea ? (
            <button 
              className={styles.addTaskButton} 
              onClick={() => setAgregandoTarea(true)}
            >
              <PlusCircle size={20} />
              Agregar nueva tarea
            </button>
          ) : (
            <div className={styles.taskForm}>
              <div className={styles.formRow}>
                <input
                  type="text"
                  placeholder="Nombre de la tarea"
                  value={nuevaTarea.titulo}
                  onChange={(e) => setNuevaTarea({...nuevaTarea, titulo: e.target.value})}
                  className={styles.taskInput}
                />
              </div>
              
              <div className={styles.formRow}>
                <textarea
                  placeholder="Descripción"
                  value={nuevaTarea.descripcion}
                  onChange={(e) => setNuevaTarea({...nuevaTarea, descripcion: e.target.value})}
                  className={styles.taskDescription}
                ></textarea>
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.iconSelector}>
                  {Object.entries(iconos).map(([key, icon]) => (
                    <button
                      key={key}
                      className={`${styles.iconButton} ${iconoSeleccionado === key ? styles.selectedIcon : ''}`}
                      onClick={() => {
                        setIconoSeleccionado(key);
                        setNuevaTarea({...nuevaTarea, icono: key});
                      }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>

                <select
                  value={nuevaTarea.prioridad}
                  onChange={(e) => setNuevaTarea({...nuevaTarea, prioridad: Number(e.target.value)})}
                  className={styles.prioritySelect}
                >
                  <option value={1}>Normal</option>
                  <option value={2}>Importante</option>
                  <option value={3}>Urgente</option>
                </select>
              </div>
              
              <div className={styles.formActions}>
                <button 
                  className={styles.cancelButton}
                  onClick={() => setAgregandoTarea(false)}
                >
                  Cancelar
                </button>
                <button 
                  className={styles.saveButton}
                  onClick={agregarTarea}
                  disabled={!nuevaTarea.titulo}
                >
                  Guardar Tarea
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.taskListContainer}>
          <div className={styles.categorySection}>
            <h2 
              className={styles.categoryTitle} 
              style={{ backgroundColor: 'var(--cornflower-blue)' }}
            >
              Lista de tareas
            </h2>
            <ul className={styles.taskList}>
              {tareas.map(tarea => (
                <li 
                  key={tarea.id} 
                  className={`${styles.taskItem} ${tarea.completada ? styles.completed : ''}`}
                >
                  <div className={styles.taskHeader}>
                    <button 
                      className={styles.checkButton}
                      onClick={() => cambiarEstadoTarea(tarea.id)}
                    >
                      {tarea.completada ? 
                        <CheckCircle2 size={24} className={styles.checkedIcon} /> : 
                        <CircleDashed size={24} className={styles.uncheckedIcon} />
                      }
                    </button>
                    
                    <div className={styles.taskContent}>
                      <div className={styles.taskTitleRow}>
                        <span className={styles.taskIcon}>
                          {iconos[tarea.icono as keyof typeof iconos]}
                        </span>
                        <h3 className={styles.taskTitle}>{tarea.titulo}</h3>
                        {tarea.prioridad > 1 && (
                          <span className={`${styles.priorityBadge} ${styles[`priority${tarea.prioridad}`]}`}>
                            {tarea.prioridad === 3 ? 'Urgente' : 'Importante'}
                          </span>
                        )}
                      </div>
                      
                      {tarea.descripcion && (
                        <p className={styles.taskDescription}>{tarea.descripcion}</p>
                      )}
                    </div>
                    
                    <button 
                      className={styles.deleteButton}
                      onClick={() => eliminarTarea(tarea.id)}
                    >
                      &times;
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.loveMessage}>
          <p>Contando los días para nuestra aventura en Punta Cana</p>
        </div>
      </footer>
    </div>
  );
}