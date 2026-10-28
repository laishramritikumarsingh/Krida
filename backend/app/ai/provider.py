import os
import re
import json
import httpx
from typing import List, Dict, Any, Optional, Tuple
from app.config import settings
from app.ai.prompts import KRIDA_SYSTEM_PROMPT

# Explicit patterns for query classification
GREETING_PATTERNS = [
    r"^(hi|hello|hey|good morning|good afternoon|good evening|howdy|sup)\b",
    r"^(who are you|what are you|what can you do|introduce yourself|what is krida)\b"
]

UNRELATED_PATTERNS = [
    r"\b(python|javascript|typescript|java|c\+\+|c#|rust|golang|html|css|sql|database|react|angular|vue)\b",
    r"\b(coding|write a script|programming|syntax|bug|compiler|algorithm to sort|binary search|docker|kubernetes)\b",
    r"\b(election|president|prime minister|parliament|congress|senate|politician|democrat|republican|geopolitics|foreign policy)\b",
    r"\b(movie|movies|film|films|actor|actress|hollywood|bollywood|netflix|cinema|song|music|lyrics|singer|album|spotify)\b",
    r"\b(video game|playstation|xbox|nintendo|anime|manga)\b",
    r"\b(capital of|largest country|population of|who invented|who discovered|world war|french revolution|currency of)\b",
    r"\b(weather in|weather today|temperature today|forecast)\b",
    r"\b(solve this equation|calculus|derivative of|integral of|quadratic equation|write an essay|write a poem|solve for x)\b",
    r"\b(bitcoin|cryptocurrency|crypto|stock market|forex|mortgage rate|dividend yield)\b",
    r"\b(car repair|fix my car|flight booking|hotel booking|horoscope|astrology)\b"
]

FITNESS_KEYWORDS = {
    'workout', 'workouts', 'training', 'train', 'trainer', 'exercise', 'exercises', 'gym', 'lift', 'lifting',
    'lifter', 'weights', 'barbell', 'dumbbells', 'dumbbell', 'kettlebell', 'cable', 'cables', 'machine',
    'bench', 'squat', 'squats', 'deadlift', 'deadlifts', 'press', 'overhead press', 'curl', 'curls', 'row', 'rows',
    'lunge', 'lunges', 'plank', 'hypertrophy', 'muscle', 'muscles', 'strength', 'rep', 'reps', 'repetition',
    'repetitions', 'set', 'sets', 'rpe', 'rir', '1rm', 'one rep max', 'compound', 'isolation', 'split', 'splits',
    'ppl', 'push pull legs', 'upper lower', 'full body', 'deload', 'warmup', 'warm-up', 'cooldown', 'cool-down',
    'progressive overload', 'overload', 'tempo', 'eccentric', 'concentric', 'form', 'technique',
    'calisthenics', 'bodyweight', 'muscle-up', 'muscle up', 'planche', 'lever', 'front lever', 'back lever',
    'human flag', 'handstand', 'l-sit', 'v-sit', 'pullup', 'pull-up', 'pullups', 'pull-ups', 'chinup', 'chin-up',
    'pushup', 'push-up', 'pushups', 'push-ups', 'dip', 'dips', 'hollow body', 'pistol squat', 'false grip',
    'hyrox', 'skierg', 'ski erg', 'sled', 'sled push', 'sled pull', 'burpee', 'burpees', 'broad jump',
    'wall ball', 'wall balls', 'farmers carry', 'farmer carry', 'sandbag', 'sandbag lunges', 'running', 'run',
    'runner', 'jog', 'jogging', 'sprint', 'sprinting', '5k', '10k', 'marathon', 'half marathon', 'vo2', 'vo2max',
    'zone 2', 'zone 3', 'zone 4', 'lactate', 'threshold', 'compromised running', 'endurance', 'stamina', 'cardio',
    'aerobic', 'anaerobic', 'rowing', 'bike', 'cycling', 'swim', 'swimming', 'triathlon', 'pace', 'pacing',
    'cadence', 'speed', 'agility', 'vertical jump',
    'nutrition', 'diet', 'dietary', 'food', 'foods', 'eat', 'eating', 'meal', 'meals', 'calorie', 'calories', 'kcal',
    'protein', 'proteins', 'carb', 'carbs', 'carbohydrate', 'carbohydrates', 'fat', 'fats', 'macro', 'macros',
    'macronutrient', 'macronutrients', 'micronutrient', 'whey', 'casein', 'creatine', 'monohydrate',
    'pre-workout', 'preworkout', 'post-workout', 'postworkout', 'intra-workout', 'intraworkout', 'bulk', 'bulking',
    'cut', 'cutting', 'deficit', 'surplus', 'tdee', 'bmr', 'hydration', 'water', 'electrolyte', 'electrolytes',
    'sodium', 'potassium', 'magnesium', 'caffeine', 'fasting', 'intermittent fasting', 'vegetarian', 'vegan',
    'non-vegetarian', 'paneer', 'chicken', 'egg', 'eggs', 'egg white', 'tofu', 'lentil', 'lentils', 'dal', 'rice',
    'oats', 'oatmeal', 'leucine', 'bcaa', 'amino acid',
    'bicep', 'biceps', 'tricep', 'triceps', 'chest', 'pecs', 'pectoral', 'back', 'lat', 'lats', 'latissimus',
    'trap', 'traps', 'trapezius', 'shoulder', 'shoulders', 'delt', 'delts', 'deltoids', 'quad', 'quads',
    'quadriceps', 'hamstring', 'hamstrings', 'glute', 'glutes', 'calf', 'calves', 'abs', 'abdominal', 'abdominals',
    'core', 'scapula', 'scapular', 'rotator cuff', 'joint', 'joints', 'tendon', 'tendons', 'ligament', 'mobility',
    'flexibility', 'stretch', 'stretching', 'foam roll', 'foam rolling', 'posture', 'impingement',
    'recovery', 'recover', 'sleep', 'sleeping', 'sore', 'soreness', 'doms', 'fatigue', 'tired', 'exhaustion',
    'overtraining', 'hrv', 'heart rate', 'heart rate variability', 'cns', 'active recovery', 'rest day', 'rest days',
    'fat loss', 'weight loss', 'lose weight', 'lose fat', 'belly fat', 'gain muscle', 'build muscle', 'lean bulk',
    'body fat', 'physique', 'body composition', 'athlete', 'athletic', 'fitness'
}

class LLMProvider:
    def __init__(self):
        self.gemini_key = settings.GEMINI_API_KEY
        self.openai_key = settings.OPENAI_API_KEY

    def _has_gemini(self) -> bool:
        return bool(self.gemini_key and len(self.gemini_key) > 10)

    def _has_openai(self) -> bool:
        return bool(self.openai_key and len(self.openai_key) > 10)

    def _call_gemini_sync(self, prompt: str, system_prompt: str = KRIDA_SYSTEM_PROMPT) -> Optional[str]:
        """Call Gemini REST API synchronously."""
        if not self._has_gemini():
            return None
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={self.gemini_key}"
            payload = {
                "systemInstruction": {"parts": [{"text": system_prompt}]},
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.4, "maxOutputTokens": 1000}
            }
            with httpx.Client(timeout=10.0) as client:
                res = client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            return parts[0].get("text", "")
        except Exception as e:
            print(f"[AI Provider] Gemini API error: {e}")
        return None

    def _call_openai_sync(self, prompt: str, system_prompt: str = KRIDA_SYSTEM_PROMPT) -> Optional[str]:
        """Call OpenAI REST API synchronously."""
        if not self._has_openai():
            return None
        try:
            url = "https://api.openai.com/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {self.openai_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.4,
                "max_tokens": 1000
            }
            with httpx.Client(timeout=10.0) as client:
                res = client.post(url, headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    choices = data.get("choices", [])
                    if choices:
                        return choices[0].get("message", {}).get("content", "")
        except Exception as e:
            print(f"[AI Provider] OpenAI API error: {e}")
        return None

    def is_greeting(self, text: str) -> bool:
        """Check if query is a greeting or introductory prompt."""
        clean = text.lower().strip()
        return any(re.search(p, clean) for p in GREETING_PATTERNS)

    def is_unrelated(self, text: str) -> bool:
        """
        Check if query is outside the domain of fitness, athletics, nutrition, and recovery.
        Returns True if explicitly non-fitness or lacks positive fitness terms.
        """
        clean = text.lower().strip()
        
        # 1. Check explicit non-fitness patterns
        for up in UNRELATED_PATTERNS:
            if re.search(up, clean):
                return True

        # 2. Check for positive fitness keywords
        has_fitness_terms = any(re.search(r'\b' + re.escape(k) + r'\b', clean) for k in FITNESS_KEYWORDS)
        if has_fitness_terms:
            return False

        # 3. If no fitness terms matched and not a greeting, it's outside domain
        return True

    def generate_chat_response(
        self,
        user_message: str,
        user_profile: Optional[Dict[str, Any]],
        rag_chunks: List[Dict[str, Any]],
        recent_logs: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Generate personalized RAG-grounded chat response.
        Enforces domain relevance and answers strictly according to the given question.
        """
        # Format knowledge context
        sources = [
            {"title": c["title"], "category": c["category"], "score": f"{c['score']:.2f}"}
            for c in rag_chunks
        ]
        context_str = "\n".join([f"- {c['title']} ({c['category']}): {c['text']}" for c in rag_chunks])

        # 1. Urgent medical emergency guardrail
        emergency_triggers = [
            "chest pain", "fainting", "fainted", "passed out", "severe breathlessness",
            "difficulty breathing", "shortness of breath", "heart attack", "broken bone",
            "bone fracture", "cannot breathe", "can't breathe"
        ]
        if any(term in user_message.lower() for term in emergency_triggers):
            reply = (
                "🚨 **URGENT MEDICAL ALERT:**\n\n"
                "The symptoms you reported (such as chest pain, fainting, or severe breathlessness) are critical warning signs that can indicate a life-threatening medical emergency. "
                "**Please immediately stop all physical activity, sit or lie down comfortably, and seek urgent emergency medical attention (or call emergency services like 112 / 911 / local emergency) without delay.**\n\n"
                "*Disclaimer: KRIDA AI is an educational fitness and sports training platform. It is strictly not an emergency service, diagnostic tool, or medical provider.*"
            )
            return {
                "reply": reply,
                "sources": [],
                "suggested_followups": [
                    "What emergency precautions should I take?",
                    "How do I recognize overtraining vs serious illness?"
                ]
            }

        # 2. Acute injury and pharmaceutical medication guardrail
        injury_triggers = [
            "sharp pain", "injury", "swollen", "torn", "dislocated", "severe pain",
            "doctor", "prescribe", "heart pain", "chest tightness", "medicine", "pill",
            "ligament tear", "meniscus tear", "herniated disc"
        ]
        if any(term in user_message.lower() for term in injury_triggers):
            reply = (
                "⚠️ **Safety Boundary Notice:**\n\n"
                "As KRIDA AI, your physical safety is my highest priority. I cannot diagnose musculoskeletal injuries, provide clinical medical opinions, or prescribe pharmaceutical medications. "
                "Because you mentioned acute pain or injury symptoms, **I strongly recommend consulting a qualified physical therapist, orthopedist, or sports physician** "
                "for an in-person diagnostic evaluation before continuing high-intensity or loaded training.\n\n"
                "In the meantime: cease all movements that trigger sharp discomfort, focus on gentle non-painful mobility, and prioritize adequate sleep and hydration."
            )
            return {
                "reply": reply,
                "sources": sources,
                "suggested_followups": [
                    "How should I warm up to prevent joint irritation?",
                    "Can you suggest a low-impact active recovery session?",
                    "How do I know when to take a deload week?"
                ]
            }

        # 3. Greeting and identity handling
        if self.is_greeting(user_message):
            athlete_name = user_profile.get("username", "Athlete") if user_profile else "Athlete"
            reply = (
                f"Hello {athlete_name}! I am **KRIDA AI Coach**, your dedicated personal fitness, sports science, and athletic conditioning mentor.\n\n"
                f"I specialize in evidence-based guidance across:\n"
                f"• 🏋️ **Gym & Hypertrophy:** Individualized workout splits, exercise technique & progressive overload\n"
                f"• 🤸 **Calisthenics:** Strict gymnastic progressions (muscle-ups, planches, levers, handstands)\n"
                f"• 🏃 **HYROX & Endurance:** Race station pacing, compromised running & Zone 2 aerobic base\n"
                f"• 🥗 **Sports Nutrition:** Target macronutrients, pre/post-workout meal timing & hydration\n"
                f"• 💤 **Athletic Recovery:** Sleep optimization, autonomic HRV tracking & deload planning\n\n"
                f"How can I assist your athletic preparation or workout today?"
            )
            return {
                "reply": reply,
                "sources": sources[:2] if sources else [],
                "suggested_followups": [
                    "Can I substitute barbell bench press with dumbbells?",
                    "What should I eat 90 minutes before a heavy workout?",
                    "How do I pace the 1km runs between HYROX stations?",
                    "How do I calculate progressive overload for my lifts?"
                ]
            }

        # 4. Strict Domain Relevance Check (Disallow unrelated topics)
        if self.is_unrelated(user_message):
            reply = (
                "I am **KRIDA AI Coach**, a specialized sports science and athletic performance mentor. "
                "I can only assist with questions strictly related to fitness, athletic training, nutrition, and recovery:\n\n"
                "• **Gym & Strength Training:** Workout splits, progressive overload, biomechanics, exercise execution & form cues\n"
                "• **Calisthenics & Gymnastics:** Bodyweight skill progressions (muscle-ups, planches, levers, handstands)\n"
                "• **HYROX & Endurance:** Race station pacing, compromised running intervals, Zone 2 aerobic base\n"
                "• **Sports Nutrition:** Macronutrient partitioning, meal timing, pre/post-workout fueling & hydration\n"
                "• **Athletic Recovery:** Sleep optimization, deload planning, HRV, and fatigue management\n\n"
                "Your inquiry appears to be outside the domain of fitness and sports performance. "
                "Please feel free to ask me a question related to your training routines, exercises, nutrition strategy, or athletic recovery!"
            )
            return {
                "reply": reply,
                "sources": [],  # Do not attach fitness citations to non-fitness questions
                "suggested_followups": [
                    "How do I calculate progressive overload for my lifts?",
                    "What should I eat 90 minutes before a heavy workout?",
                    "How do I pace the 1km runs between HYROX stations?",
                    "Can I substitute barbell bench press with dumbbells?"
                ]
            }

        # 5. Build prompt for live LLM if available
        profile_summary = (
            f"Athlete Profile: Goal={user_profile.get('primary_goal', 'Fitness')}, "
            f"Experience={user_profile.get('training_experience', 'Intermediate')}, "
            f"Level={user_profile.get('fitness_level', 'Intermediate')}, "
            f"Equipment={user_profile.get('available_equipment', ['Dumbbells'])}, "
            f"Diet={user_profile.get('dietary_preference', 'Non-Vegetarian')}, "
            f"Sports={user_profile.get('sports_interests', ['General Fitness'])}"
            if user_profile else "Athlete Profile: Intermediate fitness enthusiast"
        )

        full_prompt = (
            f"User Query: {user_message}\n\n"
            f"Athlete Profile Context:\n{profile_summary}\n\n"
            f"Retrieved Sports Science Knowledge Base:\n{context_str}\n\n"
            f"Strict Instructions:\n"
            f"1. Answer ONLY according to the specific question asked above. Do not provide unrelated generic templates or unrequested split routines.\n"
            f"2. Provide direct, actionable guidance with precise numbers (sets, reps, RPE, rest intervals, or grams/calories).\n"
            f"3. Explain the scientific physiological or biomechanical rationale concisely.\n"
            f"4. Keep the response focused, authoritative, and strictly under 250 words."
        )

        # Attempt live LLM
        live_response = self._call_gemini_sync(full_prompt) or self._call_openai_sync(full_prompt)
        if live_response:
            return {
                "reply": live_response,
                "sources": sources,
                "suggested_followups": self._generate_relevant_followups(user_message)
            }

        # 6. Context-aware intelligent local reasoning fallback
        fallback_reply, followups = self._generate_intelligent_local_response(user_message, user_profile, rag_chunks)
        return {
            "reply": fallback_reply,
            "sources": sources,
            "suggested_followups": followups
        }

    def _generate_relevant_followups(self, query: str) -> List[str]:
        q = query.lower()
        if any(w in q for w in ['replace', 'substitute', 'swap', 'alternative']):
            return [
                "What rest interval should I use for this replacement?",
                "How do I maintain progressive overload with dumbbells?",
                "Can you recommend a bodyweight alternative?"
            ]
        if any(w in q for w in ['eat', 'food', 'nutrition', 'protein', 'diet', 'meal', 'water', 'hydration']):
            return [
                "How much daily protein do I need for my goal?",
                "What is the best post-workout recovery meal?",
                "Should I add electrolytes to my workout water?"
            ]
        if any(w in q for w in ['hyrox', 'run', 'running', '5k', 'sled', 'skierg']):
            return [
                "How do I pace the compromised 1km runs in HYROX?",
                "What is my target Zone 2 heart rate range?",
                "How many interval sessions should I run per week?"
            ]
        if any(w in q for w in ['calisthenics', 'muscle-up', 'muscle up', 'planche', 'handstand', 'pull-up']):
            return [
                "How do I condition straight-arm tendon strength?",
                "How many strict pull-ups do I need before a muscle-up?",
                "What false grip drills should I practice?"
            ]
        if any(w in q for w in ['overload', 'progressive', '1rm', 'weight', 'plateau']):
            return [
                "When should I add 2.5kg to my working sets?",
                "How do Reps in Reserve (RIR) prevent overtraining?",
                "How many weekly sets should I train per muscle group?"
            ]
        return [
            "How does my recovery score affect today's workout?",
            "What should I eat before my upcoming session?",
            "Can you adjust my sets and reps for this?"
        ]

    def _generate_intelligent_local_response(
        self,
        msg: str,
        profile: Optional[Dict[str, Any]],
        rag_chunks: List[Dict[str, Any]]
    ) -> Tuple[str, List[str]]:
        """
        Dynamic reasoning engine that answers strictly according to the given fitness question.
        Returns a tuple of (reply_text, suggested_followups).
        """
        msg_lower = msg.lower()
        level = profile.get("fitness_level", "Intermediate") if profile else "Intermediate"
        goal = profile.get("primary_goal", "Muscle Gain") if profile else "Muscle Gain"
        equipment = profile.get("available_equipment", ["Dumbbells", "Barbell"]) if profile else ["Dumbbells"]
        diet = profile.get("dietary_preference", "Non-Vegetarian") if profile else "Non-Vegetarian"
        eq_str = ", ".join(equipment) if isinstance(equipment, list) else str(equipment)
        
        top_chunk = rag_chunks[0] if rag_chunks else None
        top_title = top_chunk["title"] if top_chunk else "Sports Science Exercise Physiology Corpus"

        # 1. EXERCISE SUBSTITUTION & REPLACEMENT
        if any(w in msg_lower for w in ["replace", "substitute", "substitution", "swap", "alternative to", "alternative for", "instead of"]):
            if any(w in msg_lower for w in ["bench", "chest", "push"]):
                reply = (
                    f"To substitute barbell bench press with your available equipment (**{eq_str}**), KRIDA recommends:\n\n"
                    f"• **Primary Biomechanical Swap:** **Flat or Incline Dumbbell Press (3–4 sets of 8–10 reps at RPE 8)**\n"
                    f"• **Secondary Option:** Weighted Push-ups or Parallel Bar Dips (3 sets of 10–12 reps with controlled 3s descent)\n"
                    f"• **Biomechanical Rationale:** As established in *{top_title}*, dumbbell pressing matches the horizontal adduction vector of the sternal pectoralis while permitting independent humerus rotation and natural converging motion, relieving anterior shoulder capsule impingement.\n"
                    f"• **Prescription:** Rest 90–120s between sets. Apply progressive overload by incrementing load once all sets hit 10 reps."
                )
            elif any(w in msg_lower for w in ["squat", "leg", "quad"]):
                reply = (
                    f"To substitute heavy barbell back squats using your available equipment (**{eq_str}**):\n\n"
                    f"• **Primary Biomechanical Swap:** **Dumbbell Bulgarian Split Squats (3–4 sets of 8–10 reps per leg at RPE 8)**\n"
                    f"• **Secondary Option:** Barbell Front Squats or Goblet Squats with heels elevated (3 sets of 10–12 reps)\n"
                    f"• **Biomechanical Rationale:** Unilateral split squats provide identical quadriceps and gluteus maximus motor unit recruitment with drastically reduced axial spinal compression and lower shear forces on the lumbar spine.\n"
                    f"• **Execution Cue:** Maintain a slight forward torso lean to maximize hip drive and keep your working knee tracking directly over the second toe. Rest 90s between legs."
                )
            elif any(w in msg_lower for w in ["deadlift", "back", "hinge"]):
                reply = (
                    f"To substitute conventional barbell deadlifts:\n\n"
                    f"• **Primary Biomechanical Swap:** **Romanian Deadlifts (RDL) with Dumbbells or Barbell (3–4 sets of 8–10 reps at RPE 8)**\n"
                    f"• **Secondary Option:** Trap Bar Deadlift or Single-Leg Dumbbell Deadlifts\n"
                    f"• **Biomechanical Rationale:** Romanian deadlifts isolate the eccentric lengthening phase of the hamstrings and gluteal complex while significantly mitigating lumbar flexion shear forces.\n"
                    f"• **Execution Cue:** Initiate movement from the hips, pushing them backwards until you feel a deep hamstring stretch. Keep lats packed and spine neutral. Rest 120s."
                )
            elif any(w in msg_lower for w in ["pull-up", "pullup", "chin-up", "chinup", "lat"]):
                reply = (
                    f"To substitute vertical pull-ups:\n\n"
                    f"• **Primary Biomechanical Swap:** **Inverted Bodyweight Rows or Heavy Single-Arm Dumbbell Rows (3–4 sets of 8–12 reps at RPE 8)**\n"
                    f"• **Secondary Option:** Band-Assisted Pull-ups or Lat Pulldowns\n"
                    f"• **Biomechanical Rationale:** Single-arm and inverted rows recruit the latissimus dorsi, rhomboids, and lower trapezius with scalable leverage, reinforcing scapular retraction.\n"
                    f"• **Execution Cue:** Pull through the elbows, pause for 1 second at full scapular retraction, and control a 2-second eccentric return."
                )
            else:
                reply = (
                    f"Based on your **{level}** status and available equipment (**{eq_str}**), KRIDA recommends substituting along the exact mechanical motor vector.\n\n"
                    f"• **Direct Swap:** Use dumbbell or bodyweight variations matching the joint angle and force plane (3–4 sets of 8–12 reps at RPE 8).\n"
                    f"• **Why:** As documented in *{top_title}*, unilateral and dumbbell alternatives elicit comparable motor unit recruitment while granting wrist and scapular articulation freedom.\n"
                    f"• **Prescription:** Rest 90 seconds between working sets and maintain a strict 2-3 second eccentric tempo."
                )
            return reply, [
                "What rest interval should I use for this replacement?",
                "How do I maintain progressive overload with dumbbells?",
                "Can you recommend a bodyweight alternative?"
            ]

        # 2. HYDRATION & INTRA-WORKOUT FLUIDS
        if any(w in msg_lower for w in ["water", "hydration", "hydrate", "drink", "fluid", "electrolyte", "electrolytes", "sodium", "how much water"]):
            reply = (
                f"For optimal athletic performance and muscular contractility, follow KRIDA's evidence-based hydration protocol:\n\n"
                f"• **Intra-Workout Fluid Intake:** Drink **150–250 ml (5–8 oz) every 15–20 minutes** during your session (totaling 500–750 ml per training hour).\n"
                f"• **Electrolyte Balance:** If training lasts longer than 60 minutes or in high humidity, consume **300–500 mg sodium and 100–200 mg potassium** in your water to sustain neuromuscular action potential propagation and prevent cramping.\n"
                f"• **Pre-Workout Hydration:** Drink 500 ml water 90–120 minutes prior to lifting to optimize blood plasma volume and muscle cell volumization.\n"
                f"• **Post-Workout Rehydration:** For every 1.0 kg of body mass lost via perspiration, drink **1.25 to 1.5 liters of fluid** over the following 2 hours."
            )
            return reply, [
                "What should I eat before my workout for energy?",
                "Should I add salt to my pre-workout water?",
                "How does dehydration impact strength and 1RM?"
            ]

        # 3. PRE-WORKOUT FUELING & TIMING
        is_preworkout = (
            any(w in msg_lower for w in ["pre-workout", "preworkout", "pre workout"]) or
            (("before" in msg_lower or "prior to" in msg_lower) and any(w in msg_lower for w in ["eat", "meal", "food", "nutrition", "fuel", "carb", "carbs"]))
        )
        if is_preworkout:
            diet_source = "oatmeal with banana, chia seeds, and whey isolate / soy isolate" if "veg" in diet.lower() else "oatmeal with banana, sourdough toast, and 3 egg whites or whey isolate"
            reply = (
                f"For your **{goal}** goal and **{diet}** preference, here is your evidence-based pre-workout fueling protocol:\n\n"
                f"• **Timing Window:** Consume your primary pre-training meal **90 to 120 minutes prior** to your session.\n"
                f"• **Macronutrient Composition:**\n"
                f"  - **Carbohydrates (40–50g):** Complex, easily digested carbs ({diet_source}) to fully saturate muscle glycogen reserves without digestive sluggishness.\n"
                f"  - **Protein (20–25g):** High-quality protein to provide circulating essential amino acids during mechanical breakdown.\n"
                f"  - **Fats & Fiber (<8g):** Keep dietary fat and fiber low to ensure rapid gastric clearance and avoid gastrointestinal distress.\n"
                f"• **Hydration & Sodium:** Drink 500 ml of water with a small pinch of sodium 45 minutes before training to enhance muscle pump dynamics."
            )
            return reply, [
                "What should I eat post-workout for optimal recovery?",
                "Should I take caffeine or pre-workout supplements?",
                "How does pre-workout meal timing affect blood sugar?"
            ]

        # 4. POST-WORKOUT NUTRITION & PROTEIN SYNTHESIS
        is_postworkout = (
            any(w in msg_lower for w in ["post-workout", "postworkout", "post workout"]) or
            (("after" in msg_lower or "following" in msg_lower) and any(w in msg_lower for w in ["eat", "meal", "food", "nutrition", "protein", "shake", "anabolic"]))
        )
        if is_postworkout:
            diet_spec = "tofu, lentils, edamame, and whey/pea protein isolate" if "veg" in diet.lower() else "grilled chicken breast, egg whites, Greek yogurt, or whey isolate"
            reply = (
                f"To maximize muscle protein synthesis (MPS) and glycogen resynthesis following training:\n\n"
                f"• **Anabolic Window Timing:** Consume your recovery meal **within 45 to 90 minutes** post-workout.\n"
                f"• **Protein Target (30–40g):** High-leucine protein ({diet_spec}) containing at least **2.7–3.0g leucine** to maximally activate the intracellular mTORC1 pathway.\n"
                f"• **Carbohydrate Target (40–60g):** Fast-to-medium digesting carbs (white rice, banana, baked potato, or honey) to replenish glycogen stores and blunt post-exercise cortisol elevation.\n"
                f"• **Hydration:** Replenish 1.25L of fluid per kg of body weight lost during the session."
            )
            return reply, [
                "How much daily protein do I need for my goal?",
                "Is creatine effective immediately post-workout?",
                "How does sleep impact post-workout protein synthesis?"
            ]

        # 5. DAILY PROTEIN REQUIREMENTS
        if any(w in msg_lower for w in ["how much protein", "protein intake", "protein target", "protein requirement", "protein per kg", "grams of protein", "protein"]):
            reply = (
                f"Based on exercise physiology standards for your **{level}** profile and **{goal}** focus:\n\n"
                f"• **Optimal Target:** Consume **1.6 to 2.2 grams of protein per kilogram of body weight** daily (approx. 0.73–1.0 g/lb).\n"
                f"• **If in a Calorie Deficit (Cutting):** Increase to **2.2–2.4 g/kg** to protect lean skeletal muscle mass from catabolism.\n"
                f"• **Meal Distribution:** Distribute your total protein across **3 to 4 meals** (30–45g per meal), spaced roughly 3–4 hours apart to trigger muscle protein synthesis pulses throughout the day.\n"
                f"• **Key Biomarker:** Ensure each main meal contains at least **2.7g of leucine** (the trigger amino acid for mTOR signaling)."
            )
            return reply, [
                "What are the best high-protein vegetarian sources?",
                "What should I eat 90 minutes before a heavy workout?",
                "Is whey protein necessary or can I meet targets with food?"
            ]

        # 6. CREATINE & SPORTS SUPPLEMENTS
        if any(w in msg_lower for w in ["creatine", "caffeine", "bcaa", "whey protein", "supplement", "supplements"]):
            reply = (
                f"KRIDA evaluates sports supplements strictly through Grade-A peer-reviewed scientific evidence:\n\n"
                f"• **Creatine Monohydrate (Essential):**\n"
                f"  - **Dose:** 3–5 grams daily taken consistently at any time of day.\n"
                f"  - **Loading Phase:** Not required. Taking 3-5g daily fully saturates intramuscular phosphocreatine stores within 28 days without gastric upset.\n"
                f"  - **Mechanism:** Regenerates ATP during maximal anaerobic efforts, yielding a verified 5–10% increase in power and training volume.\n"
                f"• **Caffeine (Pre-Workout):** 3–6 mg/kg taken 45–60 minutes prior to training enhances motor unit recruitment and reduces perceived exertion (RPE).\n"
                f"• **Whey / Soy Isolate:** Convenient high-bioavailability protein source to hit daily protein targets."
            )
            return reply, [
                "Do I need to take creatine on my rest days?",
                "Does creatine cause water retention or bloating?",
                "How much water should I drink when taking creatine?"
            ]

        # 7. CALISTHENICS & GYMNASTIC SKILLS
        if any(w in msg_lower for w in ["calisthenics", "muscle-up", "muscle up", "planche", "front lever", "back lever", "handstand", "human flag", "l-sit", "bodyweight"]):
            reply = (
                f"For gymnastic leverage mastery and straight-arm bodyweight skill development:\n\n"
                f"• **Prerequisite Checklist (for Muscle-Up / Levers):** Ensure you possess a baseline of **10–12 strict chest-to-bar pull-ups** and **15 deep straight-bar dips** before initiating dynamic turnovers.\n"
                f"• **Straight-Arm Tendon Conditioning:** Prioritize scapular depressions, active hollow-body bar hangs, and false-grip development to condition the distal biceps tendons and shoulder joint capsules.\n"
                f"• **Transition Mechanics:** Practice explosive pull-ups to the sternum with a rapid forward head-and-chest turnover, transitioning immediately over the bar into a dip lockout.\n"
                f"• **Programming:** Perform 3–5 sets of 2–4 high-quality reps with 2–3 minutes complete rest to prioritize neural efficiency over metabolic fatigue."
            )
            return reply, [
                "How do I condition my wrists and false grip for rings?",
                "What is the progression from pull-ups to front lever?",
                "How often should I train calisthenics skills per week?"
            ]

        # 8. HYROX & ENDURANCE PACING
        if any(w in msg_lower for w in ["hyrox", "skierg", "sled push", "sled pull", "burpee broad", "wall ball", "sandbag lunge", "compromised running", "running pace", "5k", "10k", "marathon", "zone 2", "cardio"]):
            reply = (
                f"For HYROX race conditioning and compromised running optimization:\n\n"
                f"• **The Compromised Running Rule:** Train 1,000m running repeats immediately following station fatigue (e.g., 50m Sled Push + 1km run at 10K goal pace). This conditions your central nervous system to clear lactate and sustain stride cadence under severe quadriceps fatigue.\n"
                f"• **Pacing Discipline:** Keep early stations (SkiErg, Sleds) strictly in **Zone 3 (85–90% max HR)**. Exceeding your anaerobic threshold early leads to catastrophic lactate accumulation prior to stations 7 and 8 (Sandbag Lunges and Wall Balls).\n"
                f"• **Aerobic Foundation (80/20 Rule):** Ensure 80% of your weekly running mileage is accumulated in conversational **Zone 2 (HR 130–145 bpm)** to build capillary and mitochondrial density.\n"
                f"• **Biomechanical Tip:** Maintain an upright torso and steady breathing rhythm on Sleds and Lunges to protect diaphragm expansion."
            )
            return reply, [
                "What is the optimal pacing strategy for the Sled Push?",
                "How do I prevent my legs from burning out before Wall Balls?",
                "What should I eat on HYROX race day?"
            ]

        # 9. PROGRESSIVE OVERLOAD & PERIODIZATION
        if any(w in msg_lower for w in ["progressive overload", "overload", "double progression", "increase bench", "increase squat", "add weight", "plateau", "stuck on"]):
            reply = (
                f"KRIDA implements the scientific **Double-Progression Protocol** for strength and hypertrophy:\n\n"
                f"• **Step 1: Set a Target Rep Bracket:** Choose a bracket such as **6–8 reps** (strength/hypertrophy) or **8–12 reps** (hypertrophy).\n"
                f"• **Step 2: Progress Reps with Constant Load:** Keep the working weight unchanged across all sets until you can complete the top repetition target (e.g. 8 reps on every set) at **RPE <= 8.5 (1–2 Reps in Reserve)** with pristine form.\n"
                f"• **Step 3: Increment Load:** Increase working weight by **+2.5 kg for upper-body compound lifts** or **+5.0 kg for lower-body compound lifts**, dropping reps back to the bottom of the bracket (e.g. 6 reps).\n"
                f"• **Alternative Overload Vectors:** If weight cannot be increased, progress by slowing the eccentric tempo (3-second negative) or adding 1 additional working set per microcycle."
            )
            return reply, [
                "How do I know when I need a deload week?",
                "What is the difference between RPE and RIR?",
                "How many weekly sets should I train per muscle group?"
            ]

        # 10. RECOVERY, DELOAD & SLEEP
        if any(w in msg_lower for w in ["deload", "tired", "fatigue", "sore", "soreness", "doms", "sleep", "exhausted", "overtraining", "hrv", "recovery"]):
            reply = (
                f"KRIDA's recovery engine analyzes your autonomic nervous system capacity versus cumulative training strain:\n\n"
                f"• **Deload Trigger Criteria:** If you observe stalled bar velocity or reduced strength for **2 consecutive weeks**, coupled with elevated resting heart rate or joint stiffness, schedule a 1-week deload.\n"
                f"• **Deload Execution:** Reduce total weekly training volume by **40–50%** (perform 2 sets instead of 4), but keep working weight at **70–80% 1RM** at RPE 6–7 to preserve neuromuscular motor patterns.\n"
                f"• **Sleep Physiology:** Aim for **7.5 to 9 hours of restorative sleep** nightly. Over 80% of human growth hormone (HGH) secretion occurs during slow-wave Stage 3–4 NREM sleep.\n"
                f"• **Active Recovery:** On rest days, perform 20–30 minutes of light Zone 1 walking or dynamic mobility to promote blood flow without inducing muscle damage."
            )
            return reply, [
                "How does high HRV correlate with training readiness?",
                "What active recovery exercises are best for sore legs?",
                "How can I improve my deep sleep for muscle recovery?"
            ]

        # 11. FAT LOSS & BODY RECOMPOSITION
        if any(w in msg_lower for w in ["fat loss", "lose fat", "weight loss", "lose weight", "belly fat", "cutting", "cut", "bulking", "bulk", "calorie deficit", "calorie surplus"]):
            reply = (
                f"For scientific body recomposition according to your **{goal}** plan:\n\n"
                f"• **For Fat Loss (Cutting):** Maintain a moderate caloric deficit of **300 to 500 kcal/day** (targeting 0.5–0.7% body weight loss per week). Elevate protein to **2.2–2.4 g/kg** to prevent muscle catabolism during energy restriction.\n"
                f"• **For Muscle Gain (Lean Bulk):** Maintain a conservative surplus of **250 to 350 kcal/day** (targeting 0.25–0.5% body weight gain per week) with 1.8–2.0 g/kg protein to minimize adipose accumulation.\n"
                f"• **Training Rule:** Maintain high-intensity resistance training with progressive overload. Heavy mechanical tension is the primary physiological signal that instructs your body to preserve muscle tissue while oxidizing fat."
            )
            return reply, [
                "How do I calculate my maintenance calories (TDEE)?",
                "How much cardio should I do while in a deficit?",
                "What should I eat to stay full during fat loss?"
            ]

        # 12. WARM-UP & MOBILITY
        if any(w in msg_lower for w in ["warm-up", "warmup", "cool-down", "cooldown", "stretch", "stretching", "mobility", "foam roll"]):
            reply = (
                f"KRIDA's evidence-based warm-up and mobility protocol follows the 3-Tier RAMP system:\n\n"
                f"• **Tier 1: General Thermal Elevation (5 mins):** Light aerobic movement (rowing, assault bike, or dynamic jumping jacks) to raise core body temperature and synovial fluid production.\n"
                f"• **Tier 2: Dynamic Mobility (5 mins):** Multi-planar movements (World's Greatest Stretch, 90/90 hip flow, thoracic open-books, glute bridges) to mobilize targeted joint capsules.\n"
                f"• **Tier 3: Specific Neural Potentiation:** 2–3 unloaded and ramping warm-up sets of your primary compound lift before starting working sets.\n"
                f"• **Caution:** Avoid static stretches exceeding 30–45s before heavy lifting, as prolonged static stretching acutely reduces maximal force output by 5–8%."
            )
            return reply, [
                "How do I warm up specifically for heavy squats?",
                "What is the best shoulder mobility routine for bench press?",
                "How long should my post-workout cooldown take?"
            ]

        # 13. DIRECT TARGETED FITNESS FALLBACK
        reply = (
            f"Based on your **{level}** status, **{goal}** focus, and available equipment (**{eq_str}**):\n\n"
            f"KRIDA structures your response utilizing the scientific principles in *{top_title}*.\n\n"
            f"• **Direct Coaching Guidance:** For your specific inquiry, maintain strict biomechanical form, prioritize 1–2 Reps in Reserve (RIR) on compound movements, and track your working weights to verify progressive adaptation.\n"
            f"• **Actionable Next Step:** Check your scheduled session in Section 06 (Workout Schedule) or log your sets to trigger real-time overload recommendations."
        )
        return reply, [
            "Can you adjust my sets and reps for this exercise?",
            "What should I eat before my upcoming session?",
            "How do I progressively overload this next week?"
        ]

llm_provider = LLMProvider()
