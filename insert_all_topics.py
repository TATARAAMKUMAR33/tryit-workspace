"""
TryIT Complete Topic Universe
One app for entire learning journey — Class 1 to Retirement
~800+ new topics across 60+ subjects
"""

# ── SCHEMA ────────────────────────────────────────────────────────────────────
# topic_id: snake_case unique ID
# subject_id: category group
# topic_name: display name
# difficulty_range: "lo-hi" (1-10)
# is_visual: True if needs diagram
# coverage_score: 50-100 (100 = highest priority)
# question_target: target questions
# launch_phase: phase_1_now or phase_2_2027
# display_order: sort order within subject

ALL_TOPICS = []

def add(topic_id, subject_id, topic_name, difficulty_range, is_visual=False,
        coverage_score=70, question_target=5000, launch_phase="phase_1_now", display_order=1):
    ALL_TOPICS.append({
        "topic_id": topic_id,
        "subject_id": subject_id,
        "topic_name": topic_name,
        "topic_name_hi": None,
        "topic_name_ta": None,
        "parent_topic_id": None,
        "difficulty_range": difficulty_range,
        "is_visual": is_visual,
        "coverage_score": coverage_score,
        "question_target": question_target,
        "questions_available": 0,
        "display_order": display_order,
        "launch_phase": launch_phase
    })

# ══════════════════════════════════════════════════════════════════════════════
# SCHOOL — CBSE/ICSE/STATE BOARDS (Class 6-12, all subjects)
# ══════════════════════════════════════════════════════════════════════════════

# CBSE Maths Class 6-10
add("cbse_maths_class6_knowing_numbers", "cbse_maths", "Knowing Our Numbers (Class 6)", "1-3", False, 90, 3000, "phase_1_now", 1)
add("cbse_maths_class6_whole_numbers", "cbse_maths", "Whole Numbers (Class 6)", "1-3", False, 85, 3000, "phase_1_now", 2)
add("cbse_maths_class6_playing_numbers", "cbse_maths", "Playing with Numbers (Class 6)", "1-3", False, 85, 3000, "phase_1_now", 3)
add("cbse_maths_class6_basic_geometry", "cbse_maths", "Basic Geometrical Ideas (Class 6)", "1-3", True, 85, 3000, "phase_1_now", 4)
add("cbse_maths_class6_fractions", "cbse_maths", "Fractions (Class 6)", "2-4", False, 90, 3000, "phase_1_now", 5)
add("cbse_maths_class6_decimals", "cbse_maths", "Decimals (Class 6)", "2-4", False, 85, 3000, "phase_1_now", 6)
add("cbse_maths_class6_algebra_intro", "cbse_maths", "Introduction to Algebra (Class 6)", "2-4", False, 85, 3000, "phase_1_now", 7)
add("cbse_maths_class7_integers", "cbse_maths", "Integers (Class 7)", "2-4", False, 88, 3000, "phase_1_now", 8)
add("cbse_maths_class7_fractions_decimals", "cbse_maths", "Fractions and Decimals (Class 7)", "2-5", False, 88, 3000, "phase_1_now", 9)
add("cbse_maths_class7_ratio_proportion", "cbse_maths", "Ratio and Proportion (Class 7)", "3-5", False, 90, 3000, "phase_1_now", 10)
add("cbse_maths_class7_lines_angles", "cbse_maths", "Lines and Angles (Class 7)", "3-5", True, 85, 3000, "phase_1_now", 11)
add("cbse_maths_class7_triangles", "cbse_maths", "Triangles and Its Properties (Class 7)", "3-5", True, 88, 3000, "phase_1_now", 12)
add("cbse_maths_class8_rational_numbers", "cbse_maths", "Rational Numbers (Class 8)", "3-5", False, 88, 3000, "phase_1_now", 13)
add("cbse_maths_class8_linear_equations", "cbse_maths", "Linear Equations in One Variable (Class 8)", "3-6", False, 92, 3000, "phase_1_now", 14)
add("cbse_maths_class8_quadrilaterals", "cbse_maths", "Understanding Quadrilaterals (Class 8)", "3-6", True, 85, 3000, "phase_1_now", 15)
add("cbse_maths_class8_mensuration", "cbse_maths", "Mensuration (Class 8)", "4-6", True, 92, 3000, "phase_1_now", 16)
add("cbse_maths_class8_exponents", "cbse_maths", "Exponents and Powers (Class 8)", "3-5", False, 85, 3000, "phase_1_now", 17)
add("cbse_maths_class9_number_systems", "cbse_maths", "Number Systems (Class 9)", "4-7", False, 92, 5000, "phase_1_now", 18)
add("cbse_maths_class9_polynomials", "cbse_maths", "Polynomials (Class 9)", "4-7", False, 92, 5000, "phase_1_now", 19)
add("cbse_maths_class9_coordinate_geometry", "cbse_maths", "Coordinate Geometry (Class 9)", "4-7", True, 90, 5000, "phase_1_now", 20)
add("cbse_maths_class9_linear_equations_2var", "cbse_maths", "Linear Equations in Two Variables (Class 9)", "4-7", True, 92, 5000, "phase_1_now", 21)
add("cbse_maths_class9_triangles", "cbse_maths", "Triangles (Class 9)", "4-7", True, 90, 5000, "phase_1_now", 22)
add("cbse_maths_class9_circles", "cbse_maths", "Circles (Class 9)", "5-7", True, 88, 5000, "phase_1_now", 23)
add("cbse_maths_class9_heron_formula", "cbse_maths", "Heron's Formula (Class 9)", "4-6", False, 85, 5000, "phase_1_now", 24)
add("cbse_maths_class9_surface_area_volume", "cbse_maths", "Surface Areas and Volumes (Class 9)", "4-7", True, 90, 5000, "phase_1_now", 25)
add("cbse_maths_class9_statistics", "cbse_maths", "Statistics (Class 9)", "4-6", True, 88, 5000, "phase_1_now", 26)
add("cbse_maths_class10_real_numbers", "cbse_maths", "Real Numbers (Class 10)", "5-7", False, 92, 5000, "phase_1_now", 27)
add("cbse_maths_class10_polynomials", "cbse_maths", "Polynomials (Class 10)", "5-8", False, 92, 5000, "phase_1_now", 28)
add("cbse_maths_class10_pair_linear_eq", "cbse_maths", "Pair of Linear Equations (Class 10)", "5-8", True, 95, 5000, "phase_1_now", 29)
add("cbse_maths_class10_quadratic_eq", "cbse_maths", "Quadratic Equations (Class 10)", "5-8", False, 95, 5000, "phase_1_now", 30)
add("cbse_maths_class10_ap", "cbse_maths", "Arithmetic Progressions (Class 10)", "5-8", False, 92, 5000, "phase_1_now", 31)
add("cbse_maths_class10_triangles", "cbse_maths", "Triangles (Class 10)", "5-8", True, 92, 5000, "phase_1_now", 32)
add("cbse_maths_class10_coordinate_geometry", "cbse_maths", "Coordinate Geometry (Class 10)", "5-8", True, 92, 5000, "phase_1_now", 33)
add("cbse_maths_class10_trigonometry", "cbse_maths", "Introduction to Trigonometry (Class 10)", "5-8", True, 95, 5000, "phase_1_now", 34)
add("cbse_maths_class10_trig_applications", "cbse_maths", "Applications of Trigonometry (Class 10)", "5-8", True, 92, 5000, "phase_1_now", 35)
add("cbse_maths_class10_circles", "cbse_maths", "Circles (Class 10)", "5-8", True, 90, 5000, "phase_1_now", 36)
add("cbse_maths_class10_surface_volume", "cbse_maths", "Surface Areas and Volumes (Class 10)", "5-8", True, 92, 5000, "phase_1_now", 37)
add("cbse_maths_class10_statistics", "cbse_maths", "Statistics (Class 10)", "4-7", True, 90, 5000, "phase_1_now", 38)
add("cbse_maths_class10_probability", "cbse_maths", "Probability (Class 10)", "4-7", False, 90, 5000, "phase_1_now", 39)

# CBSE Science Class 6-10
add("cbse_science_class6_food_sources", "cbse_science", "Food: Where Does It Come From? (Class 6)", "1-3", False, 85, 3000, "phase_1_now", 1)
add("cbse_science_class6_fibre_fabric", "cbse_science", "Fibre to Fabric (Class 6)", "1-3", False, 80, 3000, "phase_1_now", 2)
add("cbse_science_class6_sorting_materials", "cbse_science", "Sorting Materials into Groups (Class 6)", "1-3", False, 82, 3000, "phase_1_now", 3)
add("cbse_science_class6_body_movements", "cbse_science", "Body Movements (Class 6)", "1-3", True, 85, 3000, "phase_1_now", 4)
add("cbse_science_class6_living_nonliving", "cbse_science", "The Living Organisms (Class 6)", "1-3", False, 85, 3000, "phase_1_now", 5)
add("cbse_science_class7_nutrition_plants", "cbse_science", "Nutrition in Plants (Class 7)", "2-4", True, 88, 3000, "phase_1_now", 6)
add("cbse_science_class7_nutrition_animals", "cbse_science", "Nutrition in Animals (Class 7)", "2-4", True, 88, 3000, "phase_1_now", 7)
add("cbse_science_class7_heat", "cbse_science", "Heat (Class 7)", "2-5", True, 85, 3000, "phase_1_now", 8)
add("cbse_science_class7_acids_bases", "cbse_science", "Acids, Bases and Salts (Class 7)", "3-5", False, 90, 3000, "phase_1_now", 9)
add("cbse_science_class7_physical_chemical", "cbse_science", "Physical and Chemical Changes (Class 7)", "3-5", False, 88, 3000, "phase_1_now", 10)
add("cbse_science_class8_crop_production", "cbse_science", "Crop Production and Management (Class 8)", "3-5", False, 85, 3000, "phase_1_now", 11)
add("cbse_science_class8_microorganisms", "cbse_science", "Microorganisms: Friend and Foe (Class 8)", "3-6", False, 88, 3000, "phase_1_now", 12)
add("cbse_science_class8_cell_structure", "cbse_science", "Cell: Structure and Functions (Class 8)", "3-6", True, 92, 3000, "phase_1_now", 13)
add("cbse_science_class8_force_pressure", "cbse_science", "Force and Pressure (Class 8)", "3-6", True, 90, 3000, "phase_1_now", 14)
add("cbse_science_class8_combustion", "cbse_science", "Combustion and Flame (Class 8)", "3-5", False, 85, 3000, "phase_1_now", 15)
add("cbse_science_class9_matter", "cbse_science", "Matter in Our Surroundings (Class 9)", "4-7", False, 92, 5000, "phase_1_now", 16)
add("cbse_science_class9_atom_molecule", "cbse_science", "Atoms and Molecules (Class 9)", "4-7", False, 95, 5000, "phase_1_now", 17)
add("cbse_science_class9_structure_atom", "cbse_science", "Structure of the Atom (Class 9)", "4-7", True, 95, 5000, "phase_1_now", 18)
add("cbse_science_class9_cell_fundamental", "cbse_science", "The Fundamental Unit of Life (Class 9)", "4-7", True, 92, 5000, "phase_1_now", 19)
add("cbse_science_class9_tissues", "cbse_science", "Tissues (Class 9)", "4-7", True, 90, 5000, "phase_1_now", 20)
add("cbse_science_class9_motion", "cbse_science", "Motion (Class 9)", "4-7", True, 95, 5000, "phase_1_now", 21)
add("cbse_science_class9_force_laws", "cbse_science", "Force and Laws of Motion (Class 9)", "4-7", False, 95, 5000, "phase_1_now", 22)
add("cbse_science_class9_gravitation", "cbse_science", "Gravitation (Class 9)", "4-7", False, 92, 5000, "phase_1_now", 23)
add("cbse_science_class9_sound", "cbse_science", "Sound (Class 9)", "4-6", True, 88, 5000, "phase_1_now", 24)
add("cbse_science_class10_chemical_reactions", "cbse_science", "Chemical Reactions and Equations (Class 10)", "5-8", False, 95, 5000, "phase_1_now", 25)
add("cbse_science_class10_acids_bases_salts", "cbse_science", "Acids, Bases and Salts (Class 10)", "5-8", False, 95, 5000, "phase_1_now", 26)
add("cbse_science_class10_metals_nonmetals", "cbse_science", "Metals and Non-metals (Class 10)", "5-8", False, 92, 5000, "phase_1_now", 27)
add("cbse_science_class10_carbon_compounds", "cbse_science", "Carbon and its Compounds (Class 10)", "5-8", True, 95, 5000, "phase_1_now", 28)
add("cbse_science_class10_life_processes", "cbse_science", "Life Processes (Class 10)", "5-8", True, 95, 5000, "phase_1_now", 29)
add("cbse_science_class10_control_coordination", "cbse_science", "Control and Coordination (Class 10)", "5-8", True, 92, 5000, "phase_1_now", 30)
add("cbse_science_class10_reproduction", "cbse_science", "How do Organisms Reproduce (Class 10)", "5-8", True, 90, 5000, "phase_1_now", 31)
add("cbse_science_class10_heredity", "cbse_science", "Heredity and Evolution (Class 10)", "5-8", False, 92, 5000, "phase_1_now", 32)
add("cbse_science_class10_light", "cbse_science", "Light: Reflection and Refraction (Class 10)", "5-8", True, 95, 5000, "phase_1_now", 33)
add("cbse_science_class10_human_eye", "cbse_science", "The Human Eye (Class 10)", "4-7", True, 90, 5000, "phase_1_now", 34)
add("cbse_science_class10_electricity", "cbse_science", "Electricity (Class 10)", "5-8", True, 95, 5000, "phase_1_now", 35)
add("cbse_science_class10_magnetic_effects", "cbse_science", "Magnetic Effects of Electric Current (Class 10)", "5-8", True, 92, 5000, "phase_1_now", 36)
add("cbse_science_class10_environment", "cbse_science", "Our Environment (Class 10)", "4-6", False, 85, 5000, "phase_1_now", 37)

# CBSE Social Science Class 6-10
add("cbse_sst_class9_french_revolution", "cbse_sst", "French Revolution (Class 9 History)", "4-7", False, 88, 5000, "phase_1_now", 1)
add("cbse_sst_class9_russia_socialist", "cbse_sst", "Socialism in Europe (Class 9 History)", "4-7", False, 85, 5000, "phase_1_now", 2)
add("cbse_sst_class9_nazism", "cbse_sst", "Nazism and the Rise of Hitler (Class 9 History)", "4-7", False, 88, 5000, "phase_1_now", 3)
add("cbse_sst_class9_india_contemporary", "cbse_sst", "Forest Society and Colonialism (Class 9 History)", "4-6", False, 82, 5000, "phase_1_now", 4)
add("cbse_sst_class9_drainage", "cbse_sst", "Drainage (Class 9 Geography)", "4-6", True, 85, 5000, "phase_1_now", 5)
add("cbse_sst_class9_climate", "cbse_sst", "Climate (Class 9 Geography)", "4-6", True, 88, 5000, "phase_1_now", 6)
add("cbse_sst_class9_constitution", "cbse_sst", "What is Democracy (Class 9 Polity)", "3-6", False, 90, 5000, "phase_1_now", 7)
add("cbse_sst_class10_nationalism_india", "cbse_sst", "Nationalism in India (Class 10 History)", "5-8", False, 95, 5000, "phase_1_now", 8)
add("cbse_sst_class10_age_industrialization", "cbse_sst", "Age of Industrialisation (Class 10 History)", "5-7", False, 88, 5000, "phase_1_now", 9)
add("cbse_sst_class10_resources_development", "cbse_sst", "Resources and Development (Class 10 Geography)", "4-7", True, 88, 5000, "phase_1_now", 10)
add("cbse_sst_class10_water_resources", "cbse_sst", "Water Resources (Class 10 Geography)", "4-6", True, 85, 5000, "phase_1_now", 11)
add("cbse_sst_class10_agriculture", "cbse_sst", "Agriculture (Class 10 Geography)", "4-6", True, 88, 5000, "phase_1_now", 12)
add("cbse_sst_class10_power_sharing", "cbse_sst", "Power Sharing (Class 10 Polity)", "5-8", False, 92, 5000, "phase_1_now", 13)
add("cbse_sst_class10_federalism", "cbse_sst", "Federalism (Class 10 Polity)", "5-8", False, 92, 5000, "phase_1_now", 14)
add("cbse_sst_class10_democracy_outcomes", "cbse_sst", "Outcomes of Democracy (Class 10 Polity)", "5-7", False, 88, 5000, "phase_1_now", 15)
add("cbse_sst_class10_development", "cbse_sst", "Development (Class 10 Economics)", "4-7", False, 90, 5000, "phase_1_now", 16)
add("cbse_sst_class10_money_credit", "cbse_sst", "Money and Credit (Class 10 Economics)", "5-8", False, 92, 5000, "phase_1_now", 17)
add("cbse_sst_class10_globalisation", "cbse_sst", "Globalisation and Indian Economy (Class 10 Economics)", "5-8", False, 90, 5000, "phase_1_now", 18)

# CBSE Class 11-12 Physics
add("cbse_physics_class11_kinematics", "cbse_physics_11_12", "Kinematics (Class 11)", "5-8", True, 95, 5000, "phase_1_now", 1)
add("cbse_physics_class11_laws_motion", "cbse_physics_11_12", "Laws of Motion (Class 11)", "5-8", False, 95, 5000, "phase_1_now", 2)
add("cbse_physics_class11_work_energy", "cbse_physics_11_12", "Work, Energy and Power (Class 11)", "5-8", False, 92, 5000, "phase_1_now", 3)
add("cbse_physics_class11_rotational_motion", "cbse_physics_11_12", "Rotational Motion (Class 11)", "6-9", True, 90, 5000, "phase_1_now", 4)
add("cbse_physics_class11_gravitation", "cbse_physics_11_12", "Gravitation (Class 11)", "5-8", False, 92, 5000, "phase_1_now", 5)
add("cbse_physics_class11_thermodynamics", "cbse_physics_11_12", "Thermodynamics (Class 11)", "6-9", True, 92, 5000, "phase_1_now", 6)
add("cbse_physics_class11_waves", "cbse_physics_11_12", "Waves (Class 11)", "5-8", True, 90, 5000, "phase_1_now", 7)
add("cbse_physics_class12_electrostatics", "cbse_physics_11_12", "Electrostatics (Class 12)", "6-9", True, 95, 5000, "phase_1_now", 8)
add("cbse_physics_class12_current_electricity", "cbse_physics_11_12", "Current Electricity (Class 12)", "6-9", True, 95, 5000, "phase_1_now", 9)
add("cbse_physics_class12_magnetism", "cbse_physics_11_12", "Magnetism and Matter (Class 12)", "6-9", True, 92, 5000, "phase_1_now", 10)
add("cbse_physics_class12_electromagnetic_induction", "cbse_physics_11_12", "Electromagnetic Induction (Class 12)", "6-9", True, 95, 5000, "phase_1_now", 11)
add("cbse_physics_class12_optics", "cbse_physics_11_12", "Ray Optics and Optical Instruments (Class 12)", "6-9", True, 95, 5000, "phase_1_now", 12)
add("cbse_physics_class12_dual_nature", "cbse_physics_11_12", "Dual Nature of Radiation (Class 12)", "6-9", False, 90, 5000, "phase_1_now", 13)
add("cbse_physics_class12_atoms_nuclei", "cbse_physics_11_12", "Atoms and Nuclei (Class 12)", "6-9", True, 92, 5000, "phase_1_now", 14)
add("cbse_physics_class12_semiconductor", "cbse_physics_11_12", "Semiconductor Electronics (Class 12)", "6-9", True, 95, 5000, "phase_1_now", 15)

# CBSE Class 11-12 Chemistry
add("cbse_chemistry_class11_some_basic_concepts", "cbse_chemistry_11_12", "Some Basic Concepts of Chemistry (Class 11)", "5-8", False, 95, 5000, "phase_1_now", 1)
add("cbse_chemistry_class11_atomic_structure", "cbse_chemistry_11_12", "Structure of Atom (Class 11)", "5-8", True, 95, 5000, "phase_1_now", 2)
add("cbse_chemistry_class11_periodic_table", "cbse_chemistry_11_12", "Classification of Elements (Class 11)", "5-8", True, 95, 5000, "phase_1_now", 3)
add("cbse_chemistry_class11_chemical_bonding", "cbse_chemistry_11_12", "Chemical Bonding and Molecular Structure (Class 11)", "5-8", True, 95, 5000, "phase_1_now", 4)
add("cbse_chemistry_class11_thermodynamics", "cbse_chemistry_11_12", "Thermodynamics (Class 11 Chemistry)", "6-9", False, 92, 5000, "phase_1_now", 5)
add("cbse_chemistry_class11_equilibrium", "cbse_chemistry_11_12", "Equilibrium (Class 11)", "6-9", False, 92, 5000, "phase_1_now", 6)
add("cbse_chemistry_class11_organic_basics", "cbse_chemistry_11_12", "Basic Principles of Organic Chemistry (Class 11)", "5-8", True, 95, 5000, "phase_1_now", 7)
add("cbse_chemistry_class11_hydrocarbons", "cbse_chemistry_11_12", "Hydrocarbons (Class 11)", "5-8", True, 92, 5000, "phase_1_now", 8)
add("cbse_chemistry_class12_solid_state", "cbse_chemistry_11_12", "The Solid State (Class 12)", "6-9", True, 90, 5000, "phase_1_now", 9)
add("cbse_chemistry_class12_solutions", "cbse_chemistry_11_12", "Solutions (Class 12)", "6-9", False, 92, 5000, "phase_1_now", 10)
add("cbse_chemistry_class12_electrochemistry", "cbse_chemistry_11_12", "Electrochemistry (Class 12)", "6-9", True, 95, 5000, "phase_1_now", 11)
add("cbse_chemistry_class12_chemical_kinetics", "cbse_chemistry_11_12", "Chemical Kinetics (Class 12)", "6-9", True, 92, 5000, "phase_1_now", 12)
add("cbse_chemistry_class12_coordination", "cbse_chemistry_11_12", "Coordination Compounds (Class 12)", "6-9", True, 92, 5000, "phase_1_now", 13)
add("cbse_chemistry_class12_haloalkanes", "cbse_chemistry_11_12", "Haloalkanes and Haloarenes (Class 12)", "6-9", True, 90, 5000, "phase_1_now", 14)
add("cbse_chemistry_class12_alcohols_phenols", "cbse_chemistry_11_12", "Alcohols, Phenols and Ethers (Class 12)", "6-9", True, 90, 5000, "phase_1_now", 15)
add("cbse_chemistry_class12_biomolecules", "cbse_chemistry_11_12", "Biomolecules (Class 12)", "5-8", False, 88, 5000, "phase_1_now", 16)
add("cbse_chemistry_class12_polymers", "cbse_chemistry_11_12", "Polymers (Class 12)", "5-8", False, 85, 5000, "phase_1_now", 17)

# CBSE Class 11-12 Biology
add("cbse_biology_class11_cell_unit", "cbse_biology_11_12", "Cell: The Unit of Life (Class 11)", "5-8", True, 95, 5000, "phase_1_now", 1)
add("cbse_biology_class11_biomolecules", "cbse_biology_11_12", "Biomolecules (Class 11 Biology)", "5-8", False, 92, 5000, "phase_1_now", 2)
add("cbse_biology_class11_cell_cycle", "cbse_biology_11_12", "Cell Cycle and Cell Division (Class 11)", "5-8", True, 92, 5000, "phase_1_now", 3)
add("cbse_biology_class11_transport_plants", "cbse_biology_11_12", "Transport in Plants (Class 11)", "5-8", True, 88, 5000, "phase_1_now", 4)
add("cbse_biology_class11_photosynthesis", "cbse_biology_11_12", "Photosynthesis in Higher Plants (Class 11)", "5-8", True, 95, 5000, "phase_1_now", 5)
add("cbse_biology_class11_respiration", "cbse_biology_11_12", "Respiration in Plants (Class 11)", "5-8", True, 90, 5000, "phase_1_now", 6)
add("cbse_biology_class11_digestion", "cbse_biology_11_12", "Digestion and Absorption (Class 11)", "5-8", True, 92, 5000, "phase_1_now", 7)
add("cbse_biology_class11_breathing", "cbse_biology_11_12", "Breathing and Exchange of Gases (Class 11)", "5-8", True, 90, 5000, "phase_1_now", 8)
add("cbse_biology_class11_body_fluids", "cbse_biology_11_12", "Body Fluids and Circulation (Class 11)", "5-8", True, 92, 5000, "phase_1_now", 9)
add("cbse_biology_class11_excretion", "cbse_biology_11_12", "Excretory Products and Elimination (Class 11)", "5-8", True, 88, 5000, "phase_1_now", 10)
add("cbse_biology_class12_reproduction_organisms", "cbse_biology_11_12", "Reproduction in Organisms (Class 12)", "5-8", False, 90, 5000, "phase_1_now", 11)
add("cbse_biology_class12_sexual_reproduction", "cbse_biology_11_12", "Sexual Reproduction in Flowering Plants (Class 12)", "5-8", True, 92, 5000, "phase_1_now", 12)
add("cbse_biology_class12_human_reproduction", "cbse_biology_11_12", "Human Reproduction (Class 12)", "5-8", True, 90, 5000, "phase_1_now", 13)
add("cbse_biology_class12_principles_inheritance", "cbse_biology_11_12", "Principles of Inheritance and Variation (Class 12)", "6-9", True, 95, 5000, "phase_1_now", 14)
add("cbse_biology_class12_molecular_basis", "cbse_biology_11_12", "Molecular Basis of Inheritance (Class 12)", "6-9", True, 95, 5000, "phase_1_now", 15)
add("cbse_biology_class12_evolution", "cbse_biology_11_12", "Evolution (Class 12)", "5-8", False, 90, 5000, "phase_1_now", 16)
add("cbse_biology_class12_human_health", "cbse_biology_11_12", "Human Health and Disease (Class 12)", "5-8", False, 92, 5000, "phase_1_now", 17)
add("cbse_biology_class12_biotechnology", "cbse_biology_11_12", "Biotechnology: Principles and Processes (Class 12)", "6-9", True, 92, 5000, "phase_1_now", 18)
add("cbse_biology_class12_ecosystem", "cbse_biology_11_12", "Ecosystem (Class 12)", "5-7", True, 88, 5000, "phase_1_now", 19)
add("cbse_biology_class12_biodiversity", "cbse_biology_11_12", "Biodiversity and Conservation (Class 12)", "5-7", False, 85, 5000, "phase_1_now", 20)

# ══════════════════════════════════════════════════════════════════════════════
# CODING & PROGRAMMING (All levels)
# ══════════════════════════════════════════════════════════════════════════════

# Python
add("python_basics_syntax", "python_programming", "Python Basics and Syntax", "2-5", False, 95, 5000, "phase_1_now", 1)
add("python_variables_datatypes", "python_programming", "Variables and Data Types in Python", "2-5", False, 95, 5000, "phase_1_now", 2)
add("python_control_flow", "python_programming", "Control Flow: if/else/loops in Python", "3-6", False, 95, 5000, "phase_1_now", 3)
add("python_functions", "python_programming", "Functions and Recursion in Python", "4-7", False, 92, 5000, "phase_1_now", 4)
add("python_lists_tuples", "python_programming", "Lists, Tuples and Sequences in Python", "3-6", False, 92, 5000, "phase_1_now", 5)
add("python_dictionaries_sets", "python_programming", "Dictionaries and Sets in Python", "4-7", False, 90, 5000, "phase_1_now", 6)
add("python_strings", "python_programming", "String Manipulation in Python", "3-6", False, 92, 5000, "phase_1_now", 7)
add("python_file_handling", "python_programming", "File Handling in Python", "4-7", False, 88, 5000, "phase_1_now", 8)
add("python_oops", "python_programming", "Object-Oriented Programming in Python", "5-8", False, 92, 5000, "phase_1_now", 9)
add("python_exceptions", "python_programming", "Exception Handling in Python", "4-7", False, 88, 5000, "phase_1_now", 10)
add("python_modules_packages", "python_programming", "Modules and Packages in Python", "4-7", False, 85, 5000, "phase_1_now", 11)
add("python_iterators_generators", "python_programming", "Iterators and Generators in Python", "5-8", False, 85, 5000, "phase_1_now", 12)
add("python_decorators", "python_programming", "Decorators and Closures in Python", "6-9", False, 82, 5000, "phase_2_2027", 13)
add("python_regex", "python_programming", "Regular Expressions in Python", "5-8", False, 82, 5000, "phase_1_now", 14)
add("python_numpy", "python_programming", "NumPy for Data Science", "5-8", False, 90, 5000, "phase_1_now", 15)
add("python_pandas", "python_programming", "Pandas for Data Analysis", "5-8", False, 92, 5000, "phase_1_now", 16)
add("python_matplotlib", "python_programming", "Data Visualization with Matplotlib", "5-8", True, 85, 5000, "phase_1_now", 17)
add("python_flask_basics", "python_programming", "Flask Web Framework Basics", "5-8", False, 88, 5000, "phase_1_now", 18)
add("python_django_basics", "python_programming", "Django Web Framework Basics", "6-9", False, 85, 5000, "phase_1_now", 19)
add("python_interview_questions", "python_programming", "Python Interview Questions (Top Companies)", "5-9", False, 95, 5000, "phase_1_now", 20)

# JavaScript
add("js_basics_syntax", "javascript_programming", "JavaScript Basics and Syntax", "2-5", False, 95, 5000, "phase_1_now", 1)
add("js_variables_datatypes", "javascript_programming", "Variables, Data Types and Operators in JS", "2-5", False, 95, 5000, "phase_1_now", 2)
add("js_control_flow", "javascript_programming", "Control Flow in JavaScript", "3-6", False, 92, 5000, "phase_1_now", 3)
add("js_functions_scope", "javascript_programming", "Functions and Scope in JavaScript", "4-7", False, 95, 5000, "phase_1_now", 4)
add("js_arrays_objects", "javascript_programming", "Arrays and Objects in JavaScript", "4-7", False, 95, 5000, "phase_1_now", 5)
add("js_dom_manipulation", "javascript_programming", "DOM Manipulation in JavaScript", "4-7", False, 92, 5000, "phase_1_now", 6)
add("js_events", "javascript_programming", "Event Handling in JavaScript", "4-7", False, 90, 5000, "phase_1_now", 7)
add("js_es6_features", "javascript_programming", "ES6+ Modern JavaScript Features", "5-8", False, 95, 5000, "phase_1_now", 8)
add("js_async_promises", "javascript_programming", "Async/Await and Promises in JavaScript", "5-8", False, 92, 5000, "phase_1_now", 9)
add("js_closures_prototype", "javascript_programming", "Closures and Prototype Chain in JS", "6-9", False, 88, 5000, "phase_1_now", 10)
add("js_oops", "javascript_programming", "OOP Concepts in JavaScript", "5-8", False, 90, 5000, "phase_1_now", 11)
add("js_error_handling", "javascript_programming", "Error Handling in JavaScript", "4-7", False, 85, 5000, "phase_1_now", 12)
add("js_interview_questions", "javascript_programming", "JavaScript Interview Questions (FAANG)", "5-9", False, 95, 5000, "phase_1_now", 13)

# HTML & CSS
add("html_basics_structure", "html_css_web", "HTML Basics and Document Structure", "1-4", False, 92, 5000, "phase_1_now", 1)
add("html_forms_inputs", "html_css_web", "HTML Forms and Input Elements", "2-5", False, 90, 5000, "phase_1_now", 2)
add("html_semantic_elements", "html_css_web", "HTML5 Semantic Elements", "3-6", False, 88, 5000, "phase_1_now", 3)
add("html_tables_lists", "html_css_web", "HTML Tables and Lists", "2-4", False, 85, 5000, "phase_1_now", 4)
add("css_basics_selectors", "html_css_web", "CSS Basics and Selectors", "2-5", False, 92, 5000, "phase_1_now", 5)
add("css_box_model", "html_css_web", "CSS Box Model and Layout", "3-6", True, 90, 5000, "phase_1_now", 6)
add("css_flexbox", "html_css_web", "CSS Flexbox Layout", "4-7", True, 92, 5000, "phase_1_now", 7)
add("css_grid", "html_css_web", "CSS Grid Layout", "4-7", True, 90, 5000, "phase_1_now", 8)
add("css_responsive_design", "html_css_web", "Responsive Web Design and Media Queries", "4-7", False, 92, 5000, "phase_1_now", 9)
add("css_animations", "html_css_web", "CSS Animations and Transitions", "4-7", False, 85, 5000, "phase_1_now", 10)
add("web_accessibility", "html_css_web", "Web Accessibility (WCAG) Standards", "4-7", False, 80, 5000, "phase_2_2027", 11)

# C Programming
add("c_basics_syntax", "c_programming", "C Programming Basics and Syntax", "2-5", False, 90, 5000, "phase_1_now", 1)
add("c_datatypes_operators", "c_programming", "Data Types and Operators in C", "3-6", False, 90, 5000, "phase_1_now", 2)
add("c_control_statements", "c_programming", "Control Statements in C", "3-6", False, 88, 5000, "phase_1_now", 3)
add("c_functions", "c_programming", "Functions in C", "4-7", False, 88, 5000, "phase_1_now", 4)
add("c_arrays_strings", "c_programming", "Arrays and Strings in C", "4-7", False, 90, 5000, "phase_1_now", 5)
add("c_pointers", "c_programming", "Pointers in C", "5-8", False, 92, 5000, "phase_1_now", 6)
add("c_structures_unions", "c_programming", "Structures and Unions in C", "5-8", False, 88, 5000, "phase_1_now", 7)
add("c_file_io", "c_programming", "File I/O in C", "5-7", False, 82, 5000, "phase_1_now", 8)
add("c_memory_management", "c_programming", "Dynamic Memory Management in C", "6-9", False, 88, 5000, "phase_1_now", 9)
add("c_interview_questions", "c_programming", "C Programming Interview Questions", "5-9", False, 90, 5000, "phase_1_now", 10)

# C++
add("cpp_basics_oops", "cpp_programming", "C++ Basics and OOP Concepts", "3-6", False, 92, 5000, "phase_1_now", 1)
add("cpp_classes_objects", "cpp_programming", "Classes and Objects in C++", "4-7", False, 92, 5000, "phase_1_now", 2)
add("cpp_inheritance_polymorphism", "cpp_programming", "Inheritance and Polymorphism in C++", "5-8", False, 90, 5000, "phase_1_now", 3)
add("cpp_templates", "cpp_programming", "Templates in C++", "6-9", False, 85, 5000, "phase_1_now", 4)
add("cpp_stl", "cpp_programming", "Standard Template Library (STL) in C++", "5-8", False, 92, 5000, "phase_1_now", 5)
add("cpp_exception_handling", "cpp_programming", "Exception Handling in C++", "5-8", False, 85, 5000, "phase_1_now", 6)
add("cpp_smart_pointers", "cpp_programming", "Smart Pointers and Memory in C++", "6-9", False, 85, 5000, "phase_1_now", 7)
add("cpp_interview_questions", "cpp_programming", "C++ Interview Questions (Top Companies)", "5-9", False, 92, 5000, "phase_1_now", 8)

# Java
add("java_basics_oops", "java_programming", "Java Basics and OOP Principles", "3-6", False, 95, 5000, "phase_1_now", 1)
add("java_classes_inheritance", "java_programming", "Classes, Inheritance and Interfaces in Java", "4-7", False, 95, 5000, "phase_1_now", 2)
add("java_collections", "java_programming", "Java Collections Framework", "5-8", False, 92, 5000, "phase_1_now", 3)
add("java_multithreading", "java_programming", "Multithreading and Concurrency in Java", "6-9", False, 88, 5000, "phase_1_now", 4)
add("java_exception_handling", "java_programming", "Exception Handling in Java", "4-7", False, 88, 5000, "phase_1_now", 5)
add("java_streams_lambda", "java_programming", "Java 8 Streams and Lambda Expressions", "5-8", False, 90, 5000, "phase_1_now", 6)
add("java_spring_boot", "java_programming", "Spring Boot Fundamentals", "6-9", False, 90, 5000, "phase_1_now", 7)
add("java_interview_questions", "java_programming", "Java Interview Questions (Top MNCs)", "5-9", False, 95, 5000, "phase_1_now", 8)

# SQL & Databases
add("sql_basics_queries", "sql_database", "SQL Basics and SELECT Queries", "2-5", False, 95, 5000, "phase_1_now", 1)
add("sql_joins", "sql_database", "SQL JOINs (INNER/LEFT/RIGHT/FULL)", "4-7", True, 95, 5000, "phase_1_now", 2)
add("sql_aggregations", "sql_database", "SQL Aggregation Functions and GROUP BY", "4-7", False, 92, 5000, "phase_1_now", 3)
add("sql_subqueries", "sql_database", "SQL Subqueries and Nested Queries", "5-8", False, 90, 5000, "phase_1_now", 4)
add("sql_indexes_optimization", "sql_database", "SQL Indexes and Query Optimization", "6-9", False, 88, 5000, "phase_1_now", 5)
add("sql_stored_procedures", "sql_database", "Stored Procedures and Functions in SQL", "5-8", False, 85, 5000, "phase_1_now", 6)
add("sql_transactions_acid", "sql_database", "SQL Transactions and ACID Properties", "5-8", False, 88, 5000, "phase_1_now", 7)
add("nosql_mongodb_basics", "sql_database", "MongoDB and NoSQL Fundamentals", "4-7", False, 88, 5000, "phase_1_now", 8)
add("sql_interview_questions", "sql_database", "SQL Interview Questions (Data Analyst/Engineer)", "5-9", False, 95, 5000, "phase_1_now", 9)

# Data Structures and Algorithms
add("dsa_arrays_strings", "dsa_algorithms", "Arrays and Strings in DSA", "4-7", False, 95, 5000, "phase_1_now", 1)
add("dsa_linked_list", "dsa_algorithms", "Linked Lists in DSA", "4-8", True, 92, 5000, "phase_1_now", 2)
add("dsa_stacks_queues", "dsa_algorithms", "Stacks and Queues in DSA", "4-7", False, 90, 5000, "phase_1_now", 3)
add("dsa_trees_binary", "dsa_algorithms", "Trees and Binary Search Trees", "5-8", True, 92, 5000, "phase_1_now", 4)
add("dsa_graphs", "dsa_algorithms", "Graph Theory and BFS/DFS Algorithms", "5-9", True, 90, 5000, "phase_1_now", 5)
add("dsa_sorting_algorithms", "dsa_algorithms", "Sorting Algorithms (Bubble/Merge/Quick/Heap)", "4-8", False, 95, 5000, "phase_1_now", 6)
add("dsa_searching", "dsa_algorithms", "Searching Algorithms and Binary Search", "3-7", False, 92, 5000, "phase_1_now", 7)
add("dsa_dynamic_programming", "dsa_algorithms", "Dynamic Programming Patterns", "6-10", False, 90, 5000, "phase_1_now", 8)
add("dsa_greedy_algorithms", "dsa_algorithms", "Greedy Algorithms", "5-9", False, 85, 5000, "phase_1_now", 9)
add("dsa_hashing", "dsa_algorithms", "Hashing and Hash Maps", "4-8", False, 90, 5000, "phase_1_now", 10)
add("dsa_time_space_complexity", "dsa_algorithms", "Time and Space Complexity (Big O Notation)", "4-8", False, 95, 5000, "phase_1_now", 11)
add("dsa_leetcode_patterns", "dsa_algorithms", "LeetCode Problem Patterns (Top 150)", "5-10", False, 95, 5000, "phase_1_now", 12)

# ══════════════════════════════════════════════════════════════════════════════
# CYBERSECURITY
# ══════════════════════════════════════════════════════════════════════════════
add("cybersec_fundamentals", "cybersecurity", "Cybersecurity Fundamentals and CIA Triad", "3-6", False, 92, 5000, "phase_1_now", 1)
add("cybersec_network_security", "cybersecurity", "Network Security Basics", "4-7", True, 90, 5000, "phase_1_now", 2)
add("cybersec_cryptography", "cybersecurity", "Cryptography and Encryption Concepts", "5-8", False, 90, 5000, "phase_1_now", 3)
add("cybersec_ethical_hacking", "cybersecurity", "Ethical Hacking and Penetration Testing", "5-9", False, 92, 5000, "phase_1_now", 4)
add("cybersec_web_vulnerabilities", "cybersecurity", "Web Application Security (OWASP Top 10)", "5-8", False, 92, 5000, "phase_1_now", 5)
add("cybersec_social_engineering", "cybersecurity", "Social Engineering and Phishing Attacks", "3-6", False, 88, 5000, "phase_1_now", 6)
add("cybersec_malware_analysis", "cybersecurity", "Malware Analysis and Types", "5-8", False, 85, 5000, "phase_1_now", 7)
add("cybersec_incident_response", "cybersecurity", "Incident Response and Forensics", "5-8", False, 85, 5000, "phase_1_now", 8)
add("cybersec_cloud_security", "cybersecurity", "Cloud Security Fundamentals", "5-8", False, 88, 5000, "phase_1_now", 9)
add("cybersec_comptia_security_plus", "cybersecurity", "CompTIA Security+ Exam Prep", "5-9", False, 90, 5000, "phase_1_now", 10)
add("cybersec_ceh_prep", "cybersecurity", "CEH (Certified Ethical Hacker) Prep", "6-9", False, 88, 5000, "phase_1_now", 11)
add("cybersec_cissp_prep", "cybersecurity", "CISSP Exam Preparation", "7-10", False, 85, 5000, "phase_2_2027", 12)

# ══════════════════════════════════════════════════════════════════════════════
# DATA SCIENCE & AI/ML
# ══════════════════════════════════════════════════════════════════════════════
add("ds_statistics_basics", "data_science_ml", "Statistics for Data Science", "4-7", True, 95, 5000, "phase_1_now", 1)
add("ds_probability", "data_science_ml", "Probability Theory for Data Science", "4-8", False, 92, 5000, "phase_1_now", 2)
add("ds_linear_algebra", "data_science_ml", "Linear Algebra for ML", "5-8", True, 90, 5000, "phase_1_now", 3)
add("ds_data_preprocessing", "data_science_ml", "Data Preprocessing and Feature Engineering", "4-7", False, 92, 5000, "phase_1_now", 4)
add("ds_eda", "data_science_ml", "Exploratory Data Analysis (EDA)", "4-7", True, 90, 5000, "phase_1_now", 5)
add("ml_supervised_learning", "data_science_ml", "Supervised Learning Algorithms", "5-8", True, 95, 5000, "phase_1_now", 6)
add("ml_unsupervised_learning", "data_science_ml", "Unsupervised Learning and Clustering", "5-8", True, 90, 5000, "phase_1_now", 7)
add("ml_regression", "data_science_ml", "Linear and Logistic Regression", "5-8", True, 95, 5000, "phase_1_now", 8)
add("ml_decision_trees_rf", "data_science_ml", "Decision Trees and Random Forests", "5-8", True, 92, 5000, "phase_1_now", 9)
add("ml_neural_networks", "data_science_ml", "Neural Networks and Deep Learning Basics", "6-9", True, 95, 5000, "phase_1_now", 10)
add("ml_cnn", "data_science_ml", "Convolutional Neural Networks (CNN)", "6-9", True, 90, 5000, "phase_1_now", 11)
add("ml_nlp_basics", "data_science_ml", "Natural Language Processing Basics", "5-9", False, 92, 5000, "phase_1_now", 12)
add("ml_model_evaluation", "data_science_ml", "Model Evaluation and Cross Validation", "5-8", True, 90, 5000, "phase_1_now", 13)
add("ds_power_bi", "data_science_ml", "Power BI and Data Visualization", "4-7", True, 88, 5000, "phase_1_now", 14)
add("ds_tableau", "data_science_ml", "Tableau for Business Intelligence", "4-7", True, 85, 5000, "phase_1_now", 15)
add("ds_interview_questions", "data_science_ml", "Data Science Interview Questions (Top Companies)", "5-9", False, 95, 5000, "phase_1_now", 16)

# Generative AI
add("genai_llm_basics", "generative_ai", "Large Language Models (LLM) Fundamentals", "4-8", False, 95, 5000, "phase_1_now", 1)
add("genai_prompt_engineering", "generative_ai", "Prompt Engineering Techniques", "3-7", False, 95, 5000, "phase_1_now", 2)
add("genai_rag_systems", "generative_ai", "RAG (Retrieval-Augmented Generation) Systems", "6-9", False, 90, 5000, "phase_1_now", 3)
add("genai_fine_tuning", "generative_ai", "Fine-tuning LLMs and Transfer Learning", "7-10", False, 88, 5000, "phase_1_now", 4)
add("genai_agents_tools", "generative_ai", "AI Agents and Tool Use", "6-9", False, 90, 5000, "phase_1_now", 5)
add("genai_ethics_safety", "generative_ai", "AI Ethics, Safety and Responsible AI", "4-7", False, 88, 5000, "phase_1_now", 6)
add("genai_multimodal", "generative_ai", "Multimodal AI (Vision + Language Models)", "6-9", False, 85, 5000, "phase_2_2027", 7)

# ══════════════════════════════════════════════════════════════════════════════
# CLOUD & DEVOPS
# ══════════════════════════════════════════════════════════════════════════════
add("aws_cloud_practitioner", "cloud_devops", "AWS Cloud Practitioner (CLF-C02)", "4-8", False, 95, 5000, "phase_1_now", 1)
add("aws_solutions_architect", "cloud_devops", "AWS Solutions Architect Associate (SAA-C03)", "6-9", True, 92, 5000, "phase_1_now", 2)
add("aws_developer_associate", "cloud_devops", "AWS Developer Associate (DVA-C02)", "6-9", False, 88, 5000, "phase_1_now", 3)
add("azure_fundamentals", "cloud_devops", "Microsoft Azure Fundamentals (AZ-900)", "4-8", False, 92, 5000, "phase_1_now", 4)
add("azure_administrator", "cloud_devops", "Azure Administrator Associate (AZ-104)", "6-9", False, 88, 5000, "phase_1_now", 5)
add("gcp_associate_engineer", "cloud_devops", "Google Cloud Associate Cloud Engineer", "6-9", False, 85, 5000, "phase_1_now", 6)
add("docker_fundamentals", "cloud_devops", "Docker and Containerization", "4-8", True, 92, 5000, "phase_1_now", 7)
add("kubernetes_basics", "cloud_devops", "Kubernetes (K8s) Fundamentals", "5-9", True, 90, 5000, "phase_1_now", 8)
add("devops_cicd", "cloud_devops", "CI/CD Pipelines and DevOps Practices", "5-8", True, 90, 5000, "phase_1_now", 9)
add("linux_fundamentals", "cloud_devops", "Linux Command Line Fundamentals", "3-7", False, 92, 5000, "phase_1_now", 10)
add("git_version_control", "cloud_devops", "Git and Version Control", "3-7", False, 95, 5000, "phase_1_now", 11)
add("terraform_iac", "cloud_devops", "Terraform and Infrastructure as Code", "6-9", False, 85, 5000, "phase_2_2027", 12)
add("ansible_automation", "cloud_devops", "Ansible for Configuration Management", "5-8", False, 82, 5000, "phase_2_2027", 13)

# ══════════════════════════════════════════════════════════════════════════════
# NETWORKING
# ══════════════════════════════════════════════════════════════════════════════
add("networking_fundamentals", "networking", "Computer Networking Fundamentals", "3-7", True, 92, 5000, "phase_1_now", 1)
add("networking_osi_model", "networking", "OSI Model and TCP/IP Protocols", "4-7", True, 95, 5000, "phase_1_now", 2)
add("networking_subnetting", "networking", "IP Addressing and Subnetting", "5-8", False, 92, 5000, "phase_1_now", 3)
add("networking_routing_switching", "networking", "Routing and Switching Concepts", "5-8", True, 88, 5000, "phase_1_now", 4)
add("networking_cisco_ccna", "networking", "Cisco CCNA Exam Preparation", "5-9", False, 90, 5000, "phase_1_now", 5)
add("networking_wireless", "networking", "Wireless Networking and WiFi Standards", "4-7", False, 82, 5000, "phase_1_now", 6)
add("networking_dns_dhcp", "networking", "DNS, DHCP and Network Services", "4-7", False, 85, 5000, "phase_1_now", 7)
add("networking_firewall_vpn", "networking", "Firewalls, VPN and Network Security", "5-8", False, 88, 5000, "phase_1_now", 8)

# ══════════════════════════════════════════════════════════════════════════════
# PROFESSIONAL FINANCE CERTIFICATIONS
# ══════════════════════════════════════════════════════════════════════════════
add("ca_foundation_accounts", "ca_cs_cma", "CA Foundation: Principles of Accounting", "4-8", False, 92, 5000, "phase_1_now", 1)
add("ca_foundation_law", "ca_cs_cma", "CA Foundation: Business Laws", "4-8", False, 90, 5000, "phase_1_now", 2)
add("ca_foundation_maths", "ca_cs_cma", "CA Foundation: Business Mathematics", "4-8", False, 92, 5000, "phase_1_now", 3)
add("ca_foundation_economics", "ca_cs_cma", "CA Foundation: Business Economics", "4-7", False, 88, 5000, "phase_1_now", 4)
add("ca_inter_accounts", "ca_cs_cma", "CA Intermediate: Advanced Accounting", "6-9", False, 90, 5000, "phase_1_now", 5)
add("ca_inter_taxation", "ca_cs_cma", "CA Intermediate: Income Tax and GST", "6-9", False, 92, 5000, "phase_1_now", 6)
add("ca_inter_audit", "ca_cs_cma", "CA Intermediate: Auditing and Assurance", "6-9", False, 88, 5000, "phase_1_now", 7)
add("ca_inter_fm_economics", "ca_cs_cma", "CA Intermediate: Financial Management", "6-9", False, 88, 5000, "phase_1_now", 8)
add("cs_foundation_business", "ca_cs_cma", "CS Foundation: Business Environment", "4-7", False, 85, 5000, "phase_1_now", 9)
add("cs_executive_company_law", "ca_cs_cma", "CS Executive: Company Law", "6-9", False, 85, 5000, "phase_1_now", 10)
add("cma_foundation_accounts", "ca_cs_cma", "CMA Foundation: Financial Accounting", "4-8", False, 82, 5000, "phase_1_now", 11)
add("cfa_level1_ethics", "finance_certifications", "CFA Level 1: Ethics and Standards", "6-9", False, 90, 5000, "phase_1_now", 1)
add("cfa_level1_equity", "finance_certifications", "CFA Level 1: Equity Investments", "6-9", False, 90, 5000, "phase_1_now", 2)
add("cfa_level1_fixed_income", "finance_certifications", "CFA Level 1: Fixed Income", "6-9", False, 88, 5000, "phase_1_now", 3)
add("cfa_level1_derivatives", "finance_certifications", "CFA Level 1: Derivatives", "6-9", False, 85, 5000, "phase_1_now", 4)
add("cfa_level1_quant", "finance_certifications", "CFA Level 1: Quantitative Methods", "6-9", False, 88, 5000, "phase_1_now", 5)
add("frm_part1_risk", "finance_certifications", "FRM Part 1: Foundations of Risk Management", "7-10", False, 82, 5000, "phase_2_2027", 6)
add("acca_financial_accounting", "finance_certifications", "ACCA: Financial Accounting (FA)", "5-8", False, 82, 5000, "phase_1_now", 7)
add("acca_management_accounting", "finance_certifications", "ACCA: Management Accounting (MA)", "5-8", False, 80, 5000, "phase_1_now", 8)

# ══════════════════════════════════════════════════════════════════════════════
# MANAGEMENT & MBA
# ══════════════════════════════════════════════════════════════════════════════
add("cat_quant", "mba_cat_prep", "CAT Quantitative Aptitude", "5-9", False, 95, 5000, "phase_1_now", 1)
add("cat_verbal", "mba_cat_prep", "CAT Verbal Ability and Reading Comprehension", "5-9", False, 92, 5000, "phase_1_now", 2)
add("cat_dilr", "mba_cat_prep", "CAT Data Interpretation and Logical Reasoning", "5-9", True, 95, 5000, "phase_1_now", 3)
add("mba_marketing_basics", "mba_subjects", "Marketing Management Fundamentals", "4-8", False, 88, 5000, "phase_1_now", 1)
add("mba_finance_basics", "mba_subjects", "Financial Management Basics", "5-8", False, 88, 5000, "phase_1_now", 2)
add("mba_hr_management", "mba_subjects", "Human Resource Management", "4-7", False, 85, 5000, "phase_1_now", 3)
add("mba_operations", "mba_subjects", "Operations and Supply Chain Management", "5-8", False, 82, 5000, "phase_1_now", 4)
add("mba_strategy", "mba_subjects", "Business Strategy and Competitive Analysis", "5-9", False, 85, 5000, "phase_1_now", 5)
add("mba_entrepreneurship", "mba_subjects", "Entrepreneurship and Startup Management", "4-8", False, 88, 5000, "phase_1_now", 6)
add("pmp_project_management", "mba_subjects", "PMP Project Management Professional", "5-9", True, 88, 5000, "phase_1_now", 7)
add("six_sigma_green_belt", "mba_subjects", "Six Sigma Green Belt Certification", "5-9", False, 82, 5000, "phase_2_2027", 8)

# ══════════════════════════════════════════════════════════════════════════════
# MISSING COMPETITIVE EXAMS (India)
# ══════════════════════════════════════════════════════════════════════════════
add("ssc_chsl_english", "ssc_exams", "SSC CHSL English Language", "4-7", False, 92, 5000, "phase_1_now", 1)
add("ssc_chsl_quant", "ssc_exams", "SSC CHSL Quantitative Aptitude", "4-7", False, 92, 5000, "phase_1_now", 2)
add("ssc_chsl_reasoning", "ssc_exams", "SSC CHSL General Intelligence", "4-7", False, 90, 5000, "phase_1_now", 3)
add("ssc_chsl_gk", "ssc_exams", "SSC CHSL General Awareness", "3-6", False, 90, 5000, "phase_1_now", 4)
add("ssc_mts_quant", "ssc_exams", "SSC MTS Numerical Aptitude", "3-6", False, 88, 5000, "phase_1_now", 5)
add("ssc_mts_reasoning", "ssc_exams", "SSC MTS Reasoning Ability", "3-6", False, 88, 5000, "phase_1_now", 6)
add("ssc_gd_gk", "ssc_exams", "SSC GD General Knowledge", "3-6", False, 90, 5000, "phase_1_now", 7)
add("ssc_gd_quant", "ssc_exams", "SSC GD Constable Quantitative Aptitude", "3-6", False, 88, 5000, "phase_1_now", 8)
add("rrb_group_d_physics", "rrb_exams", "RRB Group D Physics and Science", "3-6", False, 88, 5000, "phase_1_now", 1)
add("rrb_group_d_maths", "rrb_exams", "RRB Group D Mathematics", "3-7", False, 90, 5000, "phase_1_now", 2)
add("rrb_group_d_reasoning", "rrb_exams", "RRB Group D Reasoning", "3-7", False, 90, 5000, "phase_1_now", 3)
add("rrb_group_d_gk", "rrb_exams", "RRB Group D General Awareness", "3-6", False, 88, 5000, "phase_1_now", 4)
add("rrb_je_civil", "rrb_exams", "RRB Junior Engineer Civil Engineering", "5-9", False, 85, 5000, "phase_1_now", 5)
add("rrb_je_electrical", "rrb_exams", "RRB Junior Engineer Electrical Engineering", "5-9", False, 85, 5000, "phase_1_now", 6)
add("rrb_je_computer", "rrb_exams", "RRB Junior Engineer Computer Science", "5-9", False, 85, 5000, "phase_1_now", 7)
add("ibps_clerk_quant", "bank_exams", "IBPS Clerk Quantitative Aptitude", "4-8", False, 92, 5000, "phase_1_now", 1)
add("ibps_clerk_reasoning", "bank_exams", "IBPS Clerk Reasoning Ability", "4-8", False, 92, 5000, "phase_1_now", 2)
add("ibps_clerk_english", "bank_exams", "IBPS Clerk English Language", "4-7", False, 90, 5000, "phase_1_now", 3)
add("ibps_clerk_gk", "bank_exams", "IBPS Clerk General/Financial Awareness", "4-7", False, 90, 5000, "phase_1_now", 4)
add("sbi_clerk_quant", "bank_exams", "SBI Clerk Quantitative Aptitude", "4-8", False, 92, 5000, "phase_1_now", 5)
add("sbi_po_reasoning", "bank_exams", "SBI PO Reasoning Ability", "5-9", False, 92, 5000, "phase_1_now", 6)
add("lic_aao_insurance", "bank_exams", "LIC AAO Insurance and Financial Awareness", "5-8", False, 85, 5000, "phase_1_now", 7)
add("nabard_rural_development", "bank_exams", "NABARD Rural Development and Agriculture", "5-8", False, 82, 5000, "phase_1_now", 8)
add("cds_maths", "defence_exams", "CDS Mathematics", "5-8", False, 88, 5000, "phase_1_now", 1)
add("cds_english", "defence_exams", "CDS English Language", "4-8", False, 88, 5000, "phase_1_now", 2)
add("cds_gk", "defence_exams", "CDS General Knowledge", "4-8", False, 88, 5000, "phase_1_now", 3)
add("capf_gk_current", "defence_exams", "CAPF General Studies and Current Affairs", "5-8", False, 85, 5000, "phase_1_now", 4)
add("afcat_quant", "defence_exams", "AFCAT Quantitative Ability", "5-8", False, 82, 5000, "phase_1_now", 5)

# State Exams
add("tnpsc_history_tamil", "state_exams", "TNPSC History and Tamil Culture", "4-8", False, 90, 5000, "phase_1_now", 1)
add("tnpsc_polity_governance", "state_exams", "TNPSC Indian Polity and Governance", "4-8", False, 90, 5000, "phase_1_now", 2)
add("tnpsc_economy", "state_exams", "TNPSC Economy and Development", "4-8", False, 88, 5000, "phase_1_now", 3)
add("tnpsc_science_technology", "state_exams", "TNPSC Science and Technology", "4-8", False, 88, 5000, "phase_1_now", 4)
add("uppsc_gs_paper1", "state_exams", "UPPSC General Studies Paper 1", "5-9", False, 88, 5000, "phase_1_now", 5)
add("uppsc_gs_paper2", "state_exams", "UPPSC General Studies Paper 2", "5-9", False, 85, 5000, "phase_1_now", 6)
add("bpsc_gs", "state_exams", "BPSC General Studies", "5-8", False, 85, 5000, "phase_1_now", 7)
add("mpsc_gs", "state_exams", "MPSC General Studies", "5-8", False, 82, 5000, "phase_1_now", 8)
add("kpsc_gs", "state_exams", "KPSC General Studies Karnataka", "5-8", False, 82, 5000, "phase_1_now", 9)
add("appsc_gs", "state_exams", "APPSC General Studies Andhra Pradesh", "5-8", False, 82, 5000, "phase_1_now", 10)

# ══════════════════════════════════════════════════════════════════════════════
# LANGUAGE LEARNING
# ══════════════════════════════════════════════════════════════════════════════
add("tamil_grammar_basics", "tamil_language", "Tamil Grammar Basics (இலக்கணம்)", "1-5", False, 90, 5000, "phase_1_now", 1)
add("tamil_literature", "tamil_language", "Tamil Literature and Classical Works", "4-8", False, 88, 5000, "phase_1_now", 2)
add("tamil_vocab_everyday", "tamil_language", "Tamil Vocabulary for Everyday Use", "1-4", False, 85, 5000, "phase_1_now", 3)
add("tamil_tnpsc_language", "tamil_language", "Tamil Language for TNPSC Exams", "4-8", False, 92, 5000, "phase_1_now", 4)
add("hindi_grammar_basics", "hindi_language", "Hindi Grammar Fundamentals", "1-5", False, 90, 5000, "phase_1_now", 1)
add("hindi_literature", "hindi_language", "Hindi Literature and Poetry", "4-8", False, 85, 5000, "phase_1_now", 2)
add("hindi_upsc_essay", "hindi_language", "Hindi Essay Writing for UPSC", "6-9", False, 88, 5000, "phase_1_now", 3)
add("telugu_grammar", "telugu_language", "Telugu Grammar Basics", "1-5", False, 85, 5000, "phase_1_now", 1)
add("telugu_appsc_language", "telugu_language", "Telugu Language for APPSC Exams", "4-8", False, 88, 5000, "phase_1_now", 2)
add("kannada_grammar", "kannada_language", "Kannada Grammar Basics", "1-5", False, 82, 5000, "phase_1_now", 1)
add("kannada_kpsc_language", "kannada_language", "Kannada Language for KPSC Exams", "4-8", False, 85, 5000, "phase_1_now", 2)
add("marathi_grammar", "marathi_language", "Marathi Grammar Basics", "1-5", False, 82, 5000, "phase_1_now", 1)
add("bengali_grammar", "bengali_language", "Bengali Grammar Basics", "1-5", False, 80, 5000, "phase_1_now", 1)
add("french_a1_a2", "foreign_languages", "French Language A1-A2 Level", "2-5", False, 82, 5000, "phase_1_now", 1)
add("french_b1_b2", "foreign_languages", "French Language B1-B2 Level (DELF)", "5-8", False, 80, 5000, "phase_2_2027", 2)
add("german_a1_a2", "foreign_languages", "German Language A1-A2 Level", "2-5", False, 80, 5000, "phase_1_now", 3)
add("spanish_a1_a2", "foreign_languages", "Spanish Language A1-A2 Level", "2-5", False, 78, 5000, "phase_2_2027", 4)
add("japanese_n5_n4", "foreign_languages", "Japanese Language JLPT N5-N4", "3-6", False, 78, 5000, "phase_2_2027", 5)
add("mandarin_hsk1_2", "foreign_languages", "Mandarin Chinese HSK 1-2", "3-6", False, 75, 5000, "phase_2_2027", 6)

# ══════════════════════════════════════════════════════════════════════════════
# TRENDING SKILLS & FUTURE DEMAND
# ══════════════════════════════════════════════════════════════════════════════
add("blockchain_web3_basics", "emerging_tech", "Blockchain and Web3 Fundamentals", "4-8", False, 88, 5000, "phase_1_now", 1)
add("smart_contracts_solidity", "emerging_tech", "Smart Contracts and Solidity Programming", "6-9", False, 82, 5000, "phase_2_2027", 2)
add("iot_fundamentals", "emerging_tech", "Internet of Things (IoT) Fundamentals", "4-8", True, 85, 5000, "phase_1_now", 3)
add("robotics_automation", "emerging_tech", "Robotics and Industrial Automation", "5-9", True, 82, 5000, "phase_2_2027", 4)
add("quantum_computing_basics", "emerging_tech", "Quantum Computing Fundamentals", "6-10", False, 78, 5000, "phase_2_2027", 5)
add("ar_vr_development", "emerging_tech", "AR/VR Development Basics", "5-9", False, 80, 5000, "phase_2_2027", 6)
add("5g_telecom_advanced", "emerging_tech", "5G Networks and Advanced Telecom", "5-9", False, 82, 5000, "phase_1_now", 7)
add("drone_technology", "emerging_tech", "Drone Technology and UAV Operations", "4-8", False, 80, 5000, "phase_2_2027", 8)
add("ev_technology", "emerging_tech", "Electric Vehicle Technology and EV Systems", "4-8", True, 85, 5000, "phase_1_now", 9)
add("solar_renewable_energy", "emerging_tech", "Solar and Renewable Energy Systems", "4-8", True, 85, 5000, "phase_1_now", 10)

# Digital Marketing
add("digital_marketing_seo", "digital_marketing", "SEO and Search Engine Marketing", "3-7", False, 90, 5000, "phase_1_now", 1)
add("digital_marketing_social", "digital_marketing", "Social Media Marketing Strategy", "3-6", False, 88, 5000, "phase_1_now", 2)
add("digital_marketing_content", "digital_marketing", "Content Marketing and Copywriting", "3-6", False, 85, 5000, "phase_1_now", 3)
add("digital_marketing_email", "digital_marketing", "Email Marketing and Automation", "3-6", False, 82, 5000, "phase_1_now", 4)
add("digital_marketing_analytics", "digital_marketing", "Google Analytics and Web Analytics", "4-7", True, 85, 5000, "phase_1_now", 5)
add("digital_marketing_ads", "digital_marketing", "Google Ads and Facebook Ads Management", "4-7", False, 85, 5000, "phase_1_now", 6)
add("digital_marketing_ecommerce", "digital_marketing", "E-commerce Marketing and Amazon Selling", "4-7", False, 82, 5000, "phase_1_now", 7)

# UI/UX Design
add("uiux_design_principles", "uiux_design", "UI/UX Design Principles and Psychology", "3-6", False, 85, 5000, "phase_1_now", 1)
add("uiux_figma", "uiux_design", "Figma for UI/UX Design", "3-7", False, 85, 5000, "phase_1_now", 2)
add("uiux_user_research", "uiux_design", "User Research and Usability Testing", "4-7", False, 80, 5000, "phase_1_now", 3)
add("uiux_prototyping", "uiux_design", "Wireframing and Prototyping", "4-7", False, 80, 5000, "phase_1_now", 4)
add("graphic_design_basics", "uiux_design", "Graphic Design Basics and Color Theory", "2-6", True, 82, 5000, "phase_1_now", 5)

# Photography and Video
add("photography_basics", "creative_skills", "Photography Basics and Camera Settings", "2-5", False, 78, 3000, "phase_2_2027", 1)
add("video_editing_basics", "creative_skills", "Video Editing Basics (Premiere/DaVinci)", "3-6", False, 78, 3000, "phase_2_2027", 2)
add("youtube_content_creation", "creative_skills", "YouTube Content Creation and Monetization", "2-6", False, 82, 3000, "phase_1_now", 3)

# Soft Skills and Personality
add("communication_skills", "soft_skills", "Professional Communication Skills", "2-6", False, 90, 5000, "phase_1_now", 1)
add("interview_preparation", "soft_skills", "Job Interview Preparation and HR Questions", "3-7", False, 95, 5000, "phase_1_now", 2)
add("leadership_management", "soft_skills", "Leadership and Team Management Skills", "4-8", False, 85, 5000, "phase_1_now", 3)
add("time_management", "soft_skills", "Time Management and Productivity", "2-5", False, 82, 3000, "phase_1_now", 4)
add("public_speaking", "soft_skills", "Public Speaking and Presentation Skills", "3-7", False, 85, 3000, "phase_1_now", 5)
add("emotional_intelligence", "soft_skills", "Emotional Intelligence in Workplace", "3-6", False, 80, 3000, "phase_2_2027", 6)

# ITI Trades
add("iti_electrician_theory", "iti_vocational", "ITI Electrician Theory and Practice", "3-7", True, 85, 5000, "phase_1_now", 1)
add("iti_fitter_theory", "iti_vocational", "ITI Fitter Trade Theory", "3-7", True, 82, 5000, "phase_1_now", 2)
add("iti_welder_theory", "iti_vocational", "ITI Welder Trade Theory", "3-7", True, 80, 5000, "phase_1_now", 3)
add("iti_turner_theory", "iti_vocational", "ITI Turner Trade Theory", "3-7", True, 78, 5000, "phase_1_now", 4)
add("iti_copa_computer", "iti_vocational", "ITI COPA Computer Operator Theory", "2-6", False, 85, 5000, "phase_1_now", 5)
add("iti_mechanic_motor_vehicle", "iti_vocational", "ITI Mechanic Motor Vehicle Theory", "3-7", True, 82, 5000, "phase_1_now", 6)
add("iti_plumber_theory", "iti_vocational", "ITI Plumber Trade Theory", "3-6", True, 78, 5000, "phase_1_now", 7)
add("iti_civil_draftsman", "iti_vocational", "ITI Civil Draftsman Theory", "3-7", True, 78, 5000, "phase_1_now", 8)

# Healthcare and Medical
add("neet_pg_medicine", "medical_pg", "NEET PG Internal Medicine", "7-10", False, 88, 5000, "phase_1_now", 1)
add("neet_pg_surgery", "medical_pg", "NEET PG General Surgery", "7-10", False, 85, 5000, "phase_1_now", 2)
add("neet_pg_pharmacology", "medical_pg", "NEET PG Pharmacology", "7-10", False, 85, 5000, "phase_1_now", 3)
add("neet_pg_pathology", "medical_pg", "NEET PG Pathology", "7-10", True, 82, 5000, "phase_1_now", 4)
add("usmle_step1_anatomy", "usmle_prep", "USMLE Step 1 Anatomy", "7-10", True, 82, 5000, "phase_1_now", 1)
add("usmle_step1_physiology", "usmle_prep", "USMLE Step 1 Physiology", "7-10", False, 82, 5000, "phase_1_now", 2)
add("usmle_step1_biochemistry", "usmle_prep", "USMLE Step 1 Biochemistry", "7-10", False, 80, 5000, "phase_1_now", 3)
add("nursing_fundamentals", "nursing", "Nursing Fundamentals and Patient Care", "3-7", False, 85, 5000, "phase_1_now", 1)
add("nursing_pharmacology", "nursing", "Pharmacology for Nurses", "5-8", False, 85, 5000, "phase_1_now", 2)
add("nursing_medical_surgical", "nursing", "Medical-Surgical Nursing", "5-8", False, 82, 5000, "phase_1_now", 3)
add("gnm_aiims_nursing", "nursing", "AIIMS/JIPMER Nursing Entrance Prep", "5-9", False, 85, 5000, "phase_1_now", 4)

# Law
add("clat_legal_reasoning", "law_entrance", "CLAT Legal Reasoning", "5-9", False, 88, 5000, "phase_1_now", 1)
add("clat_english", "law_entrance", "CLAT English Language", "4-8", False, 85, 5000, "phase_1_now", 2)
add("clat_gk_current", "law_entrance", "CLAT General Knowledge and Current Affairs", "4-8", False, 85, 5000, "phase_1_now", 3)
add("aibe_bare_acts", "law_practice", "AIBE Bare Acts and Legal Provisions", "5-9", False, 85, 5000, "phase_1_now", 1)
add("civil_procedure_code", "law_practice", "Code of Civil Procedure (CPC)", "6-9", False, 82, 5000, "phase_1_now", 2)
add("criminal_procedure_code", "law_practice", "Code of Criminal Procedure (CrPC)", "6-9", False, 82, 5000, "phase_1_now", 3)
add("constitution_india_detailed", "law_practice", "Constitution of India — Detailed Articles", "5-9", False, 90, 5000, "phase_1_now", 4)
add("ipc_sections", "law_practice", "Indian Penal Code (IPC) Key Sections", "5-9", False, 85, 5000, "phase_1_now", 5)

# International Exams
add("ielts_reading", "international_exams", "IELTS Academic Reading Strategies", "5-8", False, 92, 5000, "phase_1_now", 1)
add("ielts_writing_task1", "international_exams", "IELTS Writing Task 1 (Academic)", "5-8", True, 90, 5000, "phase_1_now", 2)
add("ielts_writing_task2", "international_exams", "IELTS Writing Task 2 (Essays)", "5-9", False, 90, 5000, "phase_1_now", 3)
add("ielts_listening", "international_exams", "IELTS Listening Test Strategies", "4-7", False, 88, 5000, "phase_1_now", 4)
add("toefl_reading", "international_exams", "TOEFL iBT Reading Section", "5-8", False, 85, 5000, "phase_1_now", 5)
add("toefl_writing", "international_exams", "TOEFL iBT Writing Section", "5-9", False, 85, 5000, "phase_1_now", 6)
add("gre_verbal", "international_exams", "GRE Verbal Reasoning", "6-9", False, 85, 5000, "phase_1_now", 7)
add("gre_quant", "international_exams", "GRE Quantitative Reasoning", "6-9", False, 85, 5000, "phase_1_now", 8)
add("gmat_quant", "international_exams", "GMAT Quantitative Section", "6-9", False, 85, 5000, "phase_1_now", 9)
add("gmat_verbal", "international_exams", "GMAT Verbal and Critical Reasoning", "6-9", False, 82, 5000, "phase_1_now", 10)
add("sat_math", "international_exams", "SAT Mathematics", "5-8", False, 80, 5000, "phase_2_2027", 11)

# Personal Finance (Life skill — everyone needs this)
add("personal_finance_basics", "personal_finance", "Personal Finance and Money Management", "2-6", False, 90, 5000, "phase_1_now", 1)
add("mutual_funds_investing", "personal_finance", "Mutual Funds and Investment Basics", "3-7", False, 90, 5000, "phase_1_now", 2)
add("stock_market_basics", "personal_finance", "Stock Market and Share Trading Basics", "3-8", True, 90, 5000, "phase_1_now", 3)
add("income_tax_basics", "personal_finance", "Income Tax Filing and ITR Basics", "3-7", False, 88, 5000, "phase_1_now", 4)
add("insurance_basics", "personal_finance", "Insurance: Life, Health and General", "3-6", False, 85, 5000, "phase_1_now", 5)
add("real_estate_investment", "personal_finance", "Real Estate Investment Basics in India", "4-7", False, 82, 5000, "phase_1_now", 6)
add("gst_for_business", "personal_finance", "GST for Small Business Owners", "4-8", False, 88, 5000, "phase_1_now", 7)
add("retirement_planning", "personal_finance", "Retirement Planning: NPS, PPF, EPF", "3-7", False, 82, 5000, "phase_1_now", 8)

print(f"Total topics to insert: {len(ALL_TOPICS)}")

# ── INSERT TO SUPABASE ─────────────────────────────────────────────────────
import os, requests, json
from dotenv import load_dotenv

load_dotenv()
u = os.getenv('SUPABASE_URL')
k = os.getenv('SUPABASE_KEY')
h = {
    'apikey': k,
    'Authorization': f'Bearer {k}',
    'Content-Type': 'application/json',
    'Prefer': 'resolution=ignore-duplicates'  # Skip existing topic_ids
}

# Insert in batches of 50
BATCH = 50
inserted = 0
skipped = 0
errors = 0

for i in range(0, len(ALL_TOPICS), BATCH):
    batch = ALL_TOPICS[i:i+BATCH]
    try:
        r = requests.post(
            f'{u}/rest/v1/topics',
            headers=h,
            json=batch,
            timeout=30
        )
        if r.status_code in [200, 201]:
            inserted += len(batch)
            print(f'Batch {i//BATCH + 1}: +{len(batch)} inserted (total: {inserted})')
        elif r.status_code == 409:
            skipped += len(batch)
            print(f'Batch {i//BATCH + 1}: {len(batch)} already exist (skipped)')
        else:
            errors += len(batch)
            print(f'Batch {i//BATCH + 1}: ERROR {r.status_code}: {r.text[:100]}')
    except Exception as e:
        errors += len(batch)
        print(f'Batch {i//BATCH + 1}: EXCEPTION: {e}')

print(f'\nDone: {inserted} inserted | {skipped} skipped | {errors} errors')
print(f'Total topics now: run count query to check')
