export type ExerciseType = 'time' | 'reps';

export interface SetDefinition {
  id: string;
  label: string;
  repsGoal?: string;
  timeGoal?: number; // in seconds
  restTime: number; // in seconds
  rir?: string;
  isExtra?: boolean;
  isWarmup?: boolean;
}

export interface ExerciseDefinition {
  id: string;
  name: string;
  type: ExerciseType;
  info: string;
  sets: SetDefinition[];
  isCircuit?: boolean;
}

export interface RoutineDefinition {
  id: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  title: string;
  isRestDay: boolean;
  restDayMessage?: string;
  warmup?: ExerciseDefinition[];
  exercises?: ExerciseDefinition[];
}

const STRENGTH_WARMUP: ExerciseDefinition[] = [
  {
    id: 'w-estiramiento-mundo',
    name: 'Estiramiento Más Grande del Mundo',
    type: 'reps',
    info: 'Objetivo: Movilizar cadera, columna torácica y estirar isquiosurales/glúteos.\n\nEjecución:\n- Paso largo adelante con pierna derecha.\n- Manos al suelo por el interior del pie.\n- Pierna trasera estirada, despega mano derecha y gira torso apuntando al techo.\n- Sostén 1s, baja y cambia de pierna.\n\nPunto Clave: No dejes que la rodilla de atrás toque el suelo.',
    sets: [{ id: 'w-em-1', label: '1 Serie', repsGoal: '5/lado', restTime: 0 }]
  },
  {
    id: 'w-oruga-plancha',
    name: 'Transición Oruga a Plancha',
    type: 'reps',
    info: 'Objetivo: Activar el core, estabilizadores del hombro y estirar la cadena posterior.\n\nEjecución:\n- De pie, dóblate desde la cadera y toca el suelo.\n- Camina con las manos hasta plancha alta.\n- Contrae glúteos y abdomen por 2-3s.\n- Camina hacia atrás y ponte de pie.\n\nPunto Clave: No dejes que la cadera se hunda en la plancha.',
    sets: [{ id: 'w-op-1', label: '1 Serie', repsGoal: '5-8 reps', restTime: 0 }]
  },
  {
    id: 'w-sentadilla-dinamica',
    name: 'Sentadilla Dinámica de Pausa',
    type: 'reps',
    info: 'Objetivo: Lubricar cadera, rodillas y tobillos; preparar SNC.\n\nEjecución:\n- Pies anchura de hombros, puntas hacia afuera.\n- Desciende profundo sin peso, torso erguido.\n- Usa codos para empujar rodillas afuera.\n- Pausa profunda ("en el hoyo") por 2s exactos.\n- Sube explosivamente.\n\nPunto Clave: Pecho hacia adelante. Si los talones se levantan, baja menos.',
    sets: [{ id: 'w-sd-1', label: '1 Serie', repsGoal: '10 reps', restTime: 0 }]
  },
  {
    id: 'w-dislocaciones-hombro',
    name: 'Dislocaciones de Hombro con Palo',
    type: 'reps',
    info: 'Objetivo: Movilizar la cápsula articular del hombro y estirar el pectoral.\n\nEjecución:\n- Agarra un palo o toalla con agarre ancho.\n- Con brazos rectos, eleva por encima de la cabeza hacia la espalda baja.\n- Regresa a la posición inicial.\n\nPunto Clave: Movimiento fluido sin dolor. No flexiones los codos.',
    sets: [{ id: 'w-dh-1', label: '1 Serie', repsGoal: '10-15 reps', restTime: 0 }]
  }
];

export const ROUTINES: RoutineDefinition[] = [
  {
    id: 'monday-hiit',
    dayOfWeek: 1,
    title: 'VO2 Máx',
    isRestDay: false,
    warmup: [
      {
        id: 'w-shadow-boxing',
        name: 'Shadow Boxing',
        type: 'time',
        info: 'Objetivo: Elevación rápida de frecuencia cardíaca y flujo sanguíneo al tren superior.\\n\\nEjecución:\\n- Adopta una guardia de boxeo básica.\\n- Lanza combinaciones de golpes al aire de forma rítmica.\\n\\nPunto Clave: El poder del golpe viene de la rotación de la cadera y oblicuos. No lances los codos hasta su máxima extensión.',
        sets: [{ id: 'w-sb-1', label: '1 Serie', timeGoal: 120, restTime: 0 }]
      },
      {
        id: 'w-dislocaciones',
        name: 'Dislocaciones palo',
        type: 'time',
        info: 'Objetivo: Movilizar la cápsula articular del hombro y estirar el pectoral.\\n\\nEjecución:\\n- Agarra un palo o toalla con agarre ancho.\\n- Con brazos rectos, eleva por encima de la cabeza hacia la espalda baja.\\n- Regresa a la posición inicial.\\n\\nPunto Clave: Movimiento fluido sin dolor. No flexiones los codos.',
        sets: [{ id: 'w-d-1', label: '1 Serie', timeGoal: 60, restTime: 0 }]
      },
      {
        id: 'w-oruga',
        name: 'Oruga a Plancha',
        type: 'time',
        info: 'Objetivo: Activar el core, estabilizadores del hombro y estirar la cadena posterior.\\n\\nEjecución:\\n- De pie, dóblate desde la cadera y toca el suelo.\\n- Camina con las manos hasta plancha alta.\\n- Contrae glúteos y abdomen por 2-3s.\\n- Camina hacia atrás y ponte de pie.\\n\\nPunto Clave: No dejes que la cadera se hunda en la plancha.',
        sets: [{ id: 'w-o-1', label: '1 Serie', timeGoal: 60, restTime: 0 }]
      },
      {
        id: 'w-press-z',
        name: 'Press Z Ligero',
        type: 'time',
        info: 'Objetivo: Fuerza de empuje vertical y estabilización extrema del core.\\n\\nEjecución:\\n- Siéntate en el suelo con piernas estiradas (en "L").\\n- Empuja mancuernas hacia arriba hasta bloquear codos.\\n- Baja con control.\\n\\nPunto Clave: Al estar sentado sin respaldo, no puedes usar trampa. Si el peso te tira atrás, baja el peso.',
        sets: [{ id: 'w-pz-1', label: '1 Serie', timeGoal: 60, restTime: 0 }]
      },
      {
        id: 'w-remo-ren',
        name: 'Remo Renegado Ligero',
        type: 'time',
        info: 'Objetivo: Tracción horizontal pesada bajo fatiga y resistencia anti-rotacional.\\n\\nEjecución:\\n- Plancha alta apoyado sobre mancuernas, pies anchos.\\n- Jala una mancuerna hacia tu cadera.\\n- Baja lentamente y repite con el otro brazo.\\n\\nPunto Clave: LA CADERA NO GIRE al levantar el brazo.',
        sets: [{ id: 'w-rr-1', label: '1 Serie', timeGoal: 60, restTime: 0 }]
      }
    ],
    exercises: [
      {
        id: 'circuito-hiit',
        name: 'Circuito VO2 Máx',
        type: 'time',
        isCircuit: true,
        info: 'Circuito continuo de 4 ejercicios.\nFormato: 40s de trabajo activo, seguido de 20s de descanso.\nSe repite el bloque completo 6 veces.\n\nREGLA DE ORO (Circuito 40s Activo / 20s Descanso):\n- **Error:** Si fallas antes del segundo 30: El peso es muy ALTO. Bájalo.\n- **Error:** Si a los 40s respiras fácil: El peso es muy BAJO. Súbelo.\n- **Punto Ideal:** Movimiento ininterrumpido por 40s, pero los últimos 10s te falta el aire.\n\nLOS PESOS POR EJERCICIO:\n1. Shadow Boxing con Mancuernas: Peso: 1 a 2 kg (Máximo 3 kg). Enfoque: Velocidad máxima y rotación de cadera, no fuerza de brazo.\n2. Press Z (Sentado en el suelo): Peso: 40% a 50% de tu peso de Press Militar normal. Enfoque: No caerte hacia atrás (espalda y abdomen rígidos).\n3. Remo Renegado (En Plancha): Peso: 50% a 60% de tu peso de Remo Unilateral normal. Enfoque: Fuerza anti-rotación (la cadera no debe girar al jalar).\n4. Floor Press Explosivo: Peso: 50% a 60% de tu peso de Floor Press pesado. Enfoque: Disparar la mancuerna al techo rapidísimo en cada repetición. No hacer movimientos lentos.',
        sets: Array.from({ length: 24 }).map((_, i) => {
          const round = Math.floor(i / 4) + 1;
          const station = i % 4;
          const labels = ['Shadow Boxing', 'Press Z', 'Remo Renegado', 'Floor Press'];
          return {
            id: `hiit-r${round}-e${station+1}`,
            label: labels[station],
            timeGoal: 40,
            restTime: 20
          };
        })
      }
    ]
  },
  {
    id: 'tuesday-leg-a',
    dayOfWeek: 2,
    title: 'Pierna A - Tensión Mecánica',
    isRestDay: false,
    warmup: STRENGTH_WARMUP,
    exercises: [
      {
        id: 'sentadilla-barra',
        name: 'Sentadilla con Barra',
        type: 'reps',
        info: 'Objetivo: Tensión mecánica global del tren inferior.\\n\\nEjecución:\\n- Barra sobre trapecios.\\n- Pies algo más anchos que la cadera.\\n- Desciende enviando cadera atrás y doblando rodillas. Pecho alto.\\n- Rompe el paralelo si la movilidad lo permite.\\n- Empuja el suelo para subir.\\n\\nPunto Clave: Tensión en abdomen. Rodillas siguen la línea de los pies, nunca colapsan hacia adentro.\\n\\nIntensidad (RIR):\\n- Serie 1: RIR 2\\n- Serie 2: RIR 1\\n- Serie 3: RIR 1\\n\\nAproximaciones (Rampa):\\n- 50% x 8 reps\\n- 70% x 4 reps\\n- 90% x 1 rep',
        sets: [
          { id: 'sb-w1', label: 'Aprox. 1', repsGoal: '8 Reps (50%)', restTime: 60, rir: 'Rampa de Fuerza', isWarmup: true },
          { id: 'sb-w2', label: 'Aprox. 2', repsGoal: '4 Reps (70%)', restTime: 90, rir: 'Rampa de Fuerza', isWarmup: true },
          { id: 'sb-w3', label: 'Aprox. 3', repsGoal: '1 Rep (90%)', restTime: 120, rir: 'Activación Neural', isWarmup: true },
          { id: 'sb-1', label: 'Serie 1', repsGoal: '5-8 Reps', restTime: 180, rir: 'RIR 2' },
          { id: 'sb-2', label: 'Serie 2', repsGoal: '5-8 Reps', restTime: 180, rir: 'RIR 1' },
          { id: 'sb-3', label: 'Serie 3', repsGoal: '5-8 Reps', restTime: 180, rir: 'RIR 1' }
        ]
      },
      {
        id: 'pmr-barra',
        name: 'Peso Muerto Rumano Barra',
        type: 'reps',
        info: 'Objetivo: Desarrollo de isquiosurales, glúteos y erectores espinales.\\n\\nEjecución:\\n- Flexiona LIGERAMENTE las rodillas y fija el ángulo.\\n- Empuja cadera hacia atrás ("cerrar puerta con el trasero").\\n- Barra roza los muslos. Espalda recta.\\n- Baja hasta sentir estiramiento profundo.\\n- Empuja cadera adelante para subir.\\n\\nPunto Clave: Es una bisagra de cadera, no sentadilla. Si la barra se separa de las piernas, cargas la zona lumbar.\\n\\nIntensidad (RIR):\\n- Serie 1: RIR 2\\n- Serie 2: RIR 1\\n- Serie 3: RIR 1\\n\\nAproximaciones:\\n- Transición: 60% x 4 reps',
        sets: [
          { id: 'pmr-w1', label: 'Transición', repsGoal: '4 Reps (60%)', restTime: 60, rir: 'Adaptación al Patrón', isWarmup: true },
          { id: 'pmr-1', label: 'Serie 1', repsGoal: '8-10 Reps', restTime: 180, rir: 'RIR 2' },
          { id: 'pmr-2', label: 'Serie 2', repsGoal: '8-10 Reps', restTime: 180, rir: 'RIR 1' },
          { id: 'pmr-3', label: 'Serie 3', repsGoal: '8-10 Reps', restTime: 180, rir: 'RIR 1' }
        ]
      },
      {
        id: 'zancadas-inv',
        name: 'Zancadas Inversas Mancuernas',
        type: 'reps',
        info: 'Objetivo: Trabajo unilateral de cuádriceps y glúteo.\\n\\nEjecución:\\n- Sostén mancuernas.\\n- Paso largo hacia ATRÁS.\\n- Desciende rodilla trasera hacia el suelo (sin golpear).\\n- Empuja con pie delantero para volver.\\n\\nPunto Clave: Paso atrás reduce fuerza de cizalla en rodilla. Torso ligeramente inclinado para mayor trabajo de glúteo.\\n\\nIntensidad (RIR):\\n- Serie 1: RIR 2\\n- Serie 2: RIR 1\\n- Serie 3: RIR 0 (Fallo Técnico)',
        sets: [
          { id: 'zi-1', label: 'Serie 1', repsGoal: '10-12 Reps', restTime: 120, rir: 'RIR 2' },
          { id: 'zi-2', label: 'Serie 2', repsGoal: '10-12 Reps', restTime: 120, rir: 'RIR 1' },
          { id: 'zi-3', label: 'Serie 3', repsGoal: '10-12 Reps', restTime: 120, rir: 'RIR 0 (Fallo Técnico)' }
        ]
      },
      {
        id: 'elev-talones',
        name: 'Elevación Talones pie',
        type: 'reps',
        info: 'Objetivo: Hipertrofia del Gastrocnemio.\\n\\nEjecución:\\n- Puntas de pies sobre escalón.\\n- Deja caer talones al máximo (pausa 1-2s).\\n- Sube sobre puntas contrayendo (pausa 1s).\\n\\nPunto Clave: El rebote anula el trabajo. La pausa larga abajo es obligatoria.\\n\\nIntensidad (RIR):\\n- Serie 1: RIR 1\\n- Serie 2: RIR 0 (Fallo)\\n- Serie 3: RIR 0 (Fallo)\\n- Serie 4: RIR 0 (Fallo + Parciales)',
        sets: [
          { id: 'et-1', label: 'Serie 1', repsGoal: '12-15 Reps', restTime: 90, rir: 'RIR 1' },
          { id: 'et-2', label: 'Serie 2', repsGoal: '12-15 Reps', restTime: 90, rir: 'RIR 0 (Fallo)' },
          { id: 'et-3', label: 'Serie 3', repsGoal: '12-15 Reps', restTime: 90, rir: 'RIR 0 (Fallo)' },
          { id: 'et-4', label: 'Serie 4', repsGoal: '12-15 Reps', restTime: 90, rir: 'RIR 0 (Fallo + Parciales)' }
        ]
      }
    ]
  },
  {
    id: 'wednesday-torso-a',
    dayOfWeek: 3,
    title: 'Torso A - Fuerza Base y Empuje',
    isRestDay: false,
    warmup: STRENGTH_WARMUP,
    exercises: [
      {
        id: 'floor-press',
        name: 'Floor Press c/Barra o Mancuernas',
        type: 'reps',
        info: 'Objetivo: Empuje horizontal con énfasis en potencia metabólica.\\n\\nEjecución:\\n- Acuéstate boca arriba, rodillas dobladas.\\n- Codos a 45 grados.\\n- Empuja explosivamente hacia el techo.\\n- Baja controlado hasta que tríceps toquen el suelo. Micro-pausa y repite.\\n\\nPunto Clave: La pausa en el suelo evita el rebote y protege los hombros.\\n\\nIntensidad (RIR):\\n- Serie 1: RIR 2\\n- Serie 2: RIR 1\\n- Serie 3: RIR 1\\n- Serie 4 (Opcional): RIR 1\\n\\nAproximaciones (Rampa):\\n- 50% x 8 reps\\n- 70% x 4 reps\\n- 90% x 1 rep',
        sets: [
          { id: 'fp-w1', label: 'Aprox. 1', repsGoal: '8 Reps (50%)', restTime: 60, rir: 'Rampa de Fuerza', isWarmup: true },
          { id: 'fp-w2', label: 'Aprox. 2', repsGoal: '4 Reps (70%)', restTime: 90, rir: 'Rampa de Fuerza', isWarmup: true },
          { id: 'fp-w3', label: 'Aprox. 3', repsGoal: '1 Rep (90%)', restTime: 120, rir: 'Activación Neural', isWarmup: true },
          { id: 'fp-1', label: 'Serie 1', repsGoal: '5-8 Reps', restTime: 180, rir: 'RIR 2' },
          { id: 'fp-2', label: 'Serie 2', repsGoal: '5-8 Reps', restTime: 180, rir: 'RIR 1' },
          { id: 'fp-3', label: 'Serie 3', repsGoal: '5-8 Reps', restTime: 180, rir: 'RIR 1' },
          { id: 'fp-4', label: 'Serie 4', repsGoal: '5-8 Reps', restTime: 180, isExtra: true, rir: 'RIR 1' }
        ]
      },
      {
        id: 'remo-barra',
        name: 'Remo con Barra inclinado',
        type: 'reps',
        info: 'Objetivo: Grosor del dorso ancho y romboides.\\n\\nEjecución:\\n- Agarre más ancho que hombros.\\n- Bisagra de cadera hasta torso casi paralelo al suelo.\\n- Jala la barra hacia ombligo/cadera baja.\\n- Deprime omóplatos antes de doblar codos.\\n- Baja con control.\\n\\nPunto Clave: Si el torso se levanta, usas inercia. Mantén torso rígido y paralelo al piso.\\n\\nIntensidad (RIR):\\n- Serie 1: RIR 2\\n- Serie 2: RIR 1 (Fallo Técnico Postural)\\n- Serie 3: RIR 1 (Fallo Técnico Postural)\\n- Serie 4 (Opcional): RIR 1\\n\\nAproximaciones:\\n- Transición: 60% x 4 reps',
        sets: [
          { id: 'rb-w1', label: 'Transición', repsGoal: '4 Reps (60%)', restTime: 60, rir: 'Adaptación al Patrón', isWarmup: true },
          { id: 'rb-1', label: 'Serie 1', repsGoal: '6-8 Reps', restTime: 180, rir: 'RIR 2' },
          { id: 'rb-2', label: 'Serie 2', repsGoal: '6-8 Reps', restTime: 180, rir: 'RIR 1 (Fallo Técnico Postural)' },
          { id: 'rb-3', label: 'Serie 3', repsGoal: '6-8 Reps', restTime: 180, rir: 'RIR 1 (Fallo Técnico Postural)' },
          { id: 'rb-4', label: 'Serie 4', repsGoal: '6-8 Reps', restTime: 180, isExtra: true, rir: 'RIR 1' }
        ]
      },
      {
        id: 'press-militar',
        name: 'Press Militar estricto',
        type: 'reps',
        info: 'Objetivo: Fuerza y tamaño de deltoides anteriores y medios.\\n\\nEjecución:\\n- De pie, peso a altura de clavículas.\\n- Aprieta glúteos y core.\\n- Empuja en línea recta al techo hasta bloquear codos.\\n- Baja con control.\\n\\nPunto Clave: Cero impulso de piernas. Si flexionas rodillas es Push Press.\\n\\nIntensidad (RIR):\\n- Serie 1: RIR 2\\n- Serie 2: RIR 1\\n- Serie 3: RIR 0 (Fallo Técnico - Sin usar piernas)',
        sets: [
          { id: 'pm-1', label: 'Serie 1', repsGoal: '6-10 Reps', restTime: 150, rir: 'RIR 2' },
          { id: 'pm-2', label: 'Serie 2', repsGoal: '6-10 Reps', restTime: 150, rir: 'RIR 1' },
          { id: 'pm-3', label: 'Serie 3', repsGoal: '6-10 Reps', restTime: 150, rir: 'RIR 0 (Fallo Técnico - Sin usar piernas)' }
        ]
      },
      {
        id: 'curl-biceps',
        name: 'Curl Bíceps Barra',
        type: 'reps',
        info: 'Objetivo: Hipertrofia del bíceps braquial.\\n\\nEjecución:\\n- Agarre supinación (palmas arriba).\\n- Codos pegados a costillas.\\n- Flexiona brazos llevando peso a hombros.\\n- Baja controlando la excéntrica.\\n\\nPunto Clave: No uses balanceo con espalda baja.\\n\\nIntensidad (RIR):\\n- Serie 1: RIR 1\\n- Serie 2: RIR 0 (Fallo)\\n- Serie 3: RIR 0 (Fallo)\\n- Serie 4 (Opcional): RIR 0 (Fallo absoluto)',
        sets: [
          { id: 'cb-1', label: 'Serie 1', repsGoal: '8-12 Reps', restTime: 120, rir: 'RIR 1' },
          { id: 'cb-2', label: 'Serie 2', repsGoal: '8-12 Reps', restTime: 120, rir: 'RIR 0 (Fallo)' },
          { id: 'cb-3', label: 'Serie 3', repsGoal: '8-12 Reps', restTime: 120, rir: 'RIR 0 (Fallo)' },
          { id: 'cb-4', label: 'Serie 4', repsGoal: '8-12 Reps', restTime: 120, isExtra: true, rir: 'RIR 0 (Fallo absoluto)' }
        ]
      }
    ]
  },
  {
    id: 'thursday-rest',
    dayOfWeek: 4,
    title: 'Descanso Total',
    isRestDay: true,
    restDayMessage: 'Día de Recuperación del SNC y Matriz Extracelular. Meta: 10k-15k pasos LISS.'
  },
  {
    id: 'friday-leg-b',
    dayOfWeek: 5,
    title: 'Pierna B - Estrés Metabólico',
    isRestDay: false,
    warmup: STRENGTH_WARMUP,
    exercises: [
      {
        id: 'sentadilla-bulgara',
        name: 'Sentadilla Búlgara',
        type: 'reps',
        info: 'Objetivo: Estrés metabólico y ROM extremo en glúteo/cuádriceps.\\n\\nEjecución:\\n- Empeine trasero sobre banco.\\n- Desciende rodilla trasera hacia el suelo.\\n- Baja lo máximo posible para estirar glúteo.\\n- Sube empujando con pie delantero.\\n\\nPunto Clave: ¡No bloquees la rodilla arriba! Detén el movimiento antes de estirar por completo para mantener oclusión vascular.\\n\\nIntensidad (RIR):\\n- Serie 1: RIR 1-2\\n- Serie 2: RIR 1\\n- Serie 3: RIR 0 (Fallo Técnico/Muscular)\\n- Serie 4 (Opcional): RIR 0 (Fallo)\\n\\nAproximaciones (Rampa):\\n- 50% x 8 reps\\n- 70% x 4 reps\\n- 90% x 1 rep',
        sets: [
          { id: 'sbu-w1', label: 'Aprox. 1', repsGoal: '8 Reps (50%)', restTime: 60, rir: 'Rampa de Fuerza', isWarmup: true },
          { id: 'sbu-w2', label: 'Aprox. 2', repsGoal: '4 Reps (70%)', restTime: 90, rir: 'Rampa de Fuerza', isWarmup: true },
          { id: 'sbu-w3', label: 'Aprox. 3', repsGoal: '1 Rep (90%)', restTime: 120, rir: 'Activación Neural', isWarmup: true },
          { id: 'sbu-1', label: 'Serie 1', repsGoal: '8-12 Reps', restTime: 120, rir: 'RIR 1-2' },
          { id: 'sbu-2', label: 'Serie 2', repsGoal: '8-12 Reps', restTime: 120, rir: 'RIR 1' },
          { id: 'sbu-3', label: 'Serie 3', repsGoal: '8-12 Reps', restTime: 120, rir: 'RIR 0 (Fallo Técnico/Muscular)' },
          { id: 'sbu-4', label: 'Serie 4', repsGoal: '8-12 Reps', restTime: 120, isExtra: true, rir: 'RIR 0 (Fallo)' }
        ]
      },
      {
        id: 'pmr-mancuernas',
        name: 'Peso Muerto Piernas Rígidas Mancuernas',
        type: 'reps',
        info: 'Objetivo: Estiramiento fascial de isquiosurales.\\n\\nEjecución:\\n- Rodillas AÚN MÁS RECTAS (sin bloquear).\\n- Mancuernas cuelgan por los lados o frente a piernas.\\n- Baja lentamente (3s) hasta estiramiento máximo.\\n\\nPunto Clave: El enfoque no es peso, es sentir el músculo desgarrándose en la bajada.\\n\\nIntensidad (RIR):\\n- Serie 1: RIR 2\\n- Serie 2: RIR 1\\n- Serie 3: RIR 1 (Fallo por Estiramiento)\\n\\nAproximaciones:\\n- Transición: 60% x 4 reps',
        sets: [
          { id: 'pmrm-w1', label: 'Transición', repsGoal: '4 Reps (60%)', restTime: 60, rir: 'Adaptación al Patrón', isWarmup: true },
          { id: 'pmrm-1', label: 'Serie 1', repsGoal: '10-12 Reps', restTime: 120, rir: 'RIR 2' },
          { id: 'pmrm-2', label: 'Serie 2', repsGoal: '10-12 Reps', restTime: 120, rir: 'RIR 1' },
          { id: 'pmrm-3', label: 'Serie 3', repsGoal: '10-12 Reps', restTime: 120, rir: 'RIR 1 (Fallo por Estiramiento)' }
        ]
      },
      {
        id: 'sentadilla-goblet',
        name: 'Sentadilla Goblet',
        type: 'reps',
        info: 'Objetivo: Aislamiento del cuádriceps frontal.\\n\\nEjecución:\\n- Sostén mancuerna vertical pegada al pecho ("copa").\\n- Torso completamente vertical.\\n- Baja profundo empujando rodillas adelante y abriéndolas.\\n- Sube sin bloquear rodillas.\\n\\nPunto Clave: La carga frontal evita doblarse adelante, castigando 100% los cuádriceps.\\n\\nIntensidad (RIR):\\n- Serie 1: RIR 1\\n- Serie 2: RIR 0 (Fallo Técnico Postural)\\n- Serie 3: RIR 0 (Fallo Absoluto)',
        sets: [
          { id: 'sg-1', label: 'Serie 1', repsGoal: '12-15 Reps', restTime: 90, rir: 'RIR 1' },
          { id: 'sg-2', label: 'Serie 2', repsGoal: '12-15 Reps', restTime: 90, rir: 'RIR 0 (Fallo Técnico Postural)' },
          { id: 'sg-3', label: 'Serie 3', repsGoal: '12-15 Reps', restTime: 90, rir: 'RIR 0 (Fallo Absoluto)' }
        ]
      },
      {
        id: 'elev-talones-sentado',
        name: 'Elevación Talones Sentado',
        type: 'reps',
        info: 'Objetivo: Hipertrofia del Sóleo.\\n\\nEjecución:\\n- Sentado, rodillas a 90 grados.\\n- Mancuernas pesadas sobre muslos.\\n- Levanta talones al máximo, pausa, baja controlado.\\n\\nPunto Clave: Rodilla a 90 grados apaga el gastrocnemio, dejando el trabajo al sóleo.\\n\\nIntensidad (RIR):\\n- Serie 1: RIR 1\\n- Serie 2: RIR 0 (Fallo)\\n- Serie 3: RIR 0 (Fallo)\\n- Serie 4: RIR 0 (Fallo + Parciales)',
        sets: [
          { id: 'ets-1', label: 'Serie 1', repsGoal: '15-20 Reps', restTime: 90, rir: 'RIR 1' },
          { id: 'ets-2', label: 'Serie 2', repsGoal: '15-20 Reps', restTime: 90, rir: 'RIR 0 (Fallo)' },
          { id: 'ets-3', label: 'Serie 3', repsGoal: '15-20 Reps', restTime: 90, rir: 'RIR 0 (Fallo)' },
          { id: 'ets-4', label: 'Serie 4', repsGoal: '15-20 Reps', restTime: 90, rir: 'RIR 0 (Fallo + Parciales)' }
        ]
      }
    ]
  },
  {
    id: 'saturday-torso-b',
    dayOfWeek: 6,
    title: 'Torso B - Hipertrofia Aislada',
    isRestDay: false,
    warmup: STRENGTH_WARMUP,
    exercises: [
      {
        id: 'press-suelo-espinal',
        name: 'Press de Suelo c/Elevación Espinal',
        type: 'reps',
        info: 'Objetivo: Hipertrofia de pectoral con estiramiento bajo carga.\\n\\nEjecución:\\n- Colchoneta enrollada en el suelo.\\n- Acuéstate con la elevación en tu columna (entre omóplatos).\\n- Realiza press con mancuernas.\\n\\nPunto Clave: El cojín levanta la caja torácica, permitiendo que codos bajen más allá de la espalda. Estiramiento extra.\\n\\nIntensidad (RIR):\\n- Serie 1: RIR 2\\n- Serie 2: RIR 1\\n- Serie 3: RIR 0 (Fallo Técnico Seguro)\\n- Serie 4 (Opcional): RIR 0 (Fallo)\\n\\nAproximaciones (Rampa):\\n- 50% x 8 reps\\n- 70% x 4 reps\\n- 90% x 1 rep',
        sets: [
          { id: 'pse-w1', label: 'Aprox. 1', repsGoal: '8 Reps (50%)', restTime: 60, rir: 'Rampa de Fuerza', isWarmup: true },
          { id: 'pse-w2', label: 'Aprox. 2', repsGoal: '4 Reps (70%)', restTime: 90, rir: 'Rampa de Fuerza', isWarmup: true },
          { id: 'pse-w3', label: 'Aprox. 3', repsGoal: '1 Rep (90%)', restTime: 120, rir: 'Activación Neural', isWarmup: true },
          { id: 'pse-1', label: 'Serie 1', repsGoal: '8-12 Reps', restTime: 120, rir: 'RIR 2' },
          { id: 'pse-2', label: 'Serie 2', repsGoal: '8-12 Reps', restTime: 120, rir: 'RIR 1' },
          { id: 'pse-3', label: 'Serie 3', repsGoal: '8-12 Reps', restTime: 120, rir: 'RIR 0 (Fallo Técnico Seguro)' },
          { id: 'pse-4', label: 'Serie 4', repsGoal: '8-12 Reps', restTime: 120, isExtra: true, rir: 'RIR 0 (Fallo)' }
        ]
      },
      {
        id: 'remo-uni',
        name: 'Remo Unilateral Mancuerna',
        type: 'reps',
        info: 'Objetivo: Desarrollo de dorsales sin carga axial.\\n\\nEjecución:\\n- Rodilla y mano apoyadas en banco.\\n- Torso paralelo al suelo.\\n- Deja que mancuerna tire del hombro (estiramiento).\\n- Jala hacia la cadera (no al pecho).\\n\\nPunto Clave: Movimiento como péndulo hacia la cadera, no serrucho arriba-abajo.\\n\\nIntensidad (RIR):\\n- Serie 1: RIR 1-2\\n- Serie 2: RIR 1\\n- Serie 3: RIR 0 (Fallo Muscular)\\n- Serie 4 (Opcional): RIR 0 (Fallo Muscular)\\n\\nAproximaciones:\\n- Transición: 60% x 4 reps',
        sets: [
          { id: 'ru-w1', label: 'Transición', repsGoal: '4 Reps (60%)', restTime: 60, rir: 'Adaptación al Patrón', isWarmup: true },
          { id: 'ru-1', label: 'Serie 1', repsGoal: '10-12 Reps', restTime: 90, rir: 'RIR 1-2' },
          { id: 'ru-2', label: 'Serie 2', repsGoal: '10-12 Reps', restTime: 90, rir: 'RIR 1' },
          { id: 'ru-3', label: 'Serie 3', repsGoal: '10-12 Reps', restTime: 90, rir: 'RIR 0 (Fallo Muscular)' },
          { id: 'ru-4', label: 'Serie 4', repsGoal: '10-12 Reps', restTime: 90, isExtra: true, rir: 'RIR 0 (Fallo Muscular)' }
        ]
      },
      {
        id: 'elev-laterales',
        name: 'Elevaciones Laterales estrictas',
        type: 'reps',
        info: 'Objetivo: Anchura visual (deltoides lateral).\\n\\nEjecución:\\n- Eleva brazos a los lados hasta paralelo al suelo.\\n- Ligera flexión de codo.\\n- Al final, imagina "verter agua" (rotación interna leve).\\n\\nPunto Clave: Cero balanceo. Mejor poco peso y altas reps buscando quemazón.\\n\\nIntensidad (RIR):\\n- Serie 1: RIR 1\\n- Serie 2: RIR 0 (Fallo)\\n- Serie 3: RIR 0 (Fallo)\\n- Serie 4: RIR 0 (Fallo + Parciales)',
        sets: [
          { id: 'el-1', label: 'Serie 1', repsGoal: '15-20 Reps', restTime: 90, rir: 'RIR 1' },
          { id: 'el-2', label: 'Serie 2', repsGoal: '15-20 Reps', restTime: 90, rir: 'RIR 0 (Fallo)' },
          { id: 'el-3', label: 'Serie 3', repsGoal: '15-20 Reps', restTime: 90, rir: 'RIR 0 (Fallo)' },
          { id: 'el-4', label: 'Serie 4', repsGoal: '15-20 Reps', restTime: 90, rir: 'RIR 0 (Fallo + Parciales)' }
        ]
      },
      {
        id: 'super-brazos',
        name: 'Superserie: Rompecráneos + Curl Martillo',
        type: 'reps',
        info: 'Objetivo: Tríceps (cabeza larga) y Braquial.\\n\\nEjecución Rompecráneos:\\n- Boca arriba, brazos al techo.\\n- Flexiona codos bajando mancuernas a las sienes.\\n- Extiende contrayendo tríceps (codos apuntan al techo).\\n\\nEjecución Curl Martillo:\\n- De pie, agarre neutro.\\n- Flexiona llevando mancuernas a hombros.\\n\\nPunto Clave: Sin descanso entre ejercicios.\\n\\nIntensidad (RIR):\\n- Serie 1: RIR 1 (Ambos)\\n- Serie 2: RIR 0 (Ambos - Fallo Técnico)\\n- Serie 3: RIR 0 (Ambos - Fallo Absoluto)',
        sets: [
          { id: 'sbz-1', label: 'Serie 1', repsGoal: '10-15 Reps', restTime: 120, rir: 'RIR 1 (Ambos)' },
          { id: 'sbz-2', label: 'Serie 2', repsGoal: '10-15 Reps', restTime: 120, rir: 'RIR 0 (Ambos - Fallo Técnico)' },
          { id: 'sbz-3', label: 'Serie 3', repsGoal: '10-15 Reps', restTime: 120, rir: 'RIR 0 (Ambos - Fallo Absoluto)' }
        ]
      }
    ]
  },
  {
    id: 'sunday-rest',
    dayOfWeek: 0,
    title: 'Descanso Total',
    isRestDay: true,
    restDayMessage: 'Día de Recuperación del SNC y Matriz Extracelular. Meta: 10k-15k pasos LISS.'
  }
];
