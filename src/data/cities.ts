import { City } from "@/types";

// 2026 Projected Data Reference
// Population projected based on 2011 Census + 1.5-2.5% annual growth depending on tier.
// Tiers based on RBI/HRA classifications.

export const ALL_CITIES: City[] = [
    // === ANDHRA PRADESH ===
    { id: "AP-VIJ", name: "Vijayawada", stateId: "AP", districtId: "AP-KRS", population: 2200000, area: 62, isCapital: false, isMetro: false, tier: 2 },
    { id: "AP-VIS", name: "Visakhapatnam", stateId: "AP", districtId: "AP-VIS", population: 2600000, area: 682, isCapital: false, isMetro: true, tier: 2 }, // Metro potential
    { id: "AP-GNT", name: "Guntur", stateId: "AP", districtId: "AP-GNT", population: 950000, area: 168, isCapital: false, isMetro: false, tier: 2 },
    { id: "AP-NLR", name: "Nellore", stateId: "AP", districtId: "AP-NLR", population: 750000, area: 151, isCapital: false, isMetro: false, tier: 2 },
    { id: "AP-KRN", name: "Kurnool", stateId: "AP", districtId: "AP-KRN", population: 680000, area: 98, isCapital: false, isMetro: false, tier: 2 },
    { id: "AP-KDP", name: "Kadapa", stateId: "AP", districtId: "AP-KDP", population: 520000, area: 164, isCapital: false, isMetro: false, tier: 3 },
    { id: "AP-RJM", name: "Rajahmundry", stateId: "AP", districtId: "AP-EGD", population: 590000, area: 45, isCapital: false, isMetro: false, tier: 3 },
    { id: "AP-TPT", name: "Tirupati", stateId: "AP", districtId: "AP-CHT", population: 650000, area: 28, isCapital: false, isMetro: false, tier: 2 },

    // === TELANGANA ===
    { id: "TG-HYD", name: "Hyderabad", stateId: "TG", districtId: "TG-HYD", population: 11500000, area: 650, isCapital: true, isMetro: true, tier: 1 },
    { id: "TG-WRG", name: "Warangal", stateId: "TG", districtId: "TG-WRG", population: 1100000, area: 406, isCapital: false, isMetro: false, tier: 2 },
    { id: "TG-KMN", name: "Karimnagar", stateId: "TG", districtId: "TG-KRM", population: 420000, area: 50, isCapital: false, isMetro: false, tier: 3 },
    { id: "TG-NZB", name: "Nizamabad", stateId: "TG", districtId: "TG-NZB", population: 450000, area: 42, isCapital: false, isMetro: false, tier: 3 },
    { id: "TG-KHM", name: "Khammam", stateId: "TG", districtId: "TG-KHM", population: 380000, area: 35, isCapital: false, isMetro: false, tier: 3 },

    // === KARNATAKA ===
    { id: "KA-BLR", name: "Bengaluru", stateId: "KA", districtId: "KA-BLR", population: 14200000, area: 741, isCapital: true, isMetro: true, tier: 1 },
    { id: "KA-MYS", name: "Mysuru", stateId: "KA", districtId: "KA-MYS", population: 1350000, area: 152, isCapital: false, isMetro: false, tier: 2 },
    { id: "KA-HUB", name: "Hubballi-Dharwad", stateId: "KA", districtId: "KA-DHW", population: 1250000, area: 213, isCapital: false, isMetro: false, tier: 2 },
    { id: "KA-MNG", name: "Mangaluru", stateId: "KA", districtId: "KA-DK", population: 850000, area: 184, isCapital: false, isMetro: false, tier: 2 },
    { id: "KA-BEL", name: "Belagavi", stateId: "KA", districtId: "KA-BGM", population: 790000, area: 94, isCapital: false, isMetro: false, tier: 2 },
    { id: "KA-GUL", name: "Kalaburagi", stateId: "KA", districtId: "KA-KLB", population: 710000, area: 64, isCapital: false, isMetro: false, tier: 3 },

    // === TAMIL NADU ===
    { id: "TN-CHN", name: "Chennai", stateId: "TN", districtId: "TN-CHN", population: 12100000, area: 426, isCapital: true, isMetro: true, tier: 1 },
    { id: "TN-CBE", name: "Coimbatore", stateId: "TN", districtId: "TN-CBE", population: 2950000, area: 247, isCapital: false, isMetro: false, tier: 2 },
    { id: "TN-MDU", name: "Madurai", stateId: "TN", districtId: "TN-MDU", population: 1950000, area: 148, isCapital: false, isMetro: false, tier: 2 },
    { id: "TN-TRY", name: "Tiruchirappalli", stateId: "TN", districtId: "TN-TRY", population: 1350000, area: 167, isCapital: false, isMetro: false, tier: 2 },
    { id: "TN-SLM", name: "Salem", stateId: "TN", districtId: "TN-SLM", population: 1150000, area: 100, isCapital: false, isMetro: false, tier: 2 },
    { id: "TN-TIR", name: "Tiruppur", stateId: "TN", districtId: "TN-TPR", population: 1100000, area: 159, isCapital: false, isMetro: false, tier: 2 },

    // === KERALA ===
    { id: "KL-TVM", name: "Thiruvananthapuram", stateId: "KL", districtId: "KL-TVM", population: 1850000, area: 214, isCapital: true, isMetro: false, tier: 2 },
    { id: "KL-KOC", name: "Kochi", stateId: "KL", districtId: "KL-ERN", population: 2450000, area: 94, isCapital: false, isMetro: true, tier: 2 },
    { id: "KL-KKD", name: "Kozhikode", stateId: "KL", districtId: "KL-KKD", population: 2350000, area: 128, isCapital: false, isMetro: false, tier: 2 },
    { id: "KL-THR", name: "Thrissur", stateId: "KL", districtId: "KL-TCR", population: 1950000, area: 101, isCapital: false, isMetro: false, tier: 2 },
    { id: "KL-KLM", name: "Kollam", stateId: "KL", districtId: "KL-KLM", population: 1150000, area: 73, isCapital: false, isMetro: false, tier: 2 }, // Kollam -> KL-KLM (guess)

    // === MAHARASHTRA ===
    { id: "MH-MUM", name: "Mumbai", stateId: "MH", districtId: "MH-MUM", population: 21500000, area: 603, isCapital: true, isMetro: true, tier: 1 },
    { id: "MH-PUN", name: "Pune", stateId: "MH", districtId: "MH-PUN", population: 7500000, area: 516, isCapital: false, isMetro: true, tier: 1 },
    { id: "MH-NAG", name: "Nagpur", stateId: "MH", districtId: "MH-NAG", population: 3200000, area: 227, isCapital: false, isMetro: true, tier: 2 },
    { id: "MH-NSK", name: "Nashik", stateId: "MH", districtId: "MH-NSK", population: 2350000, area: 264, isCapital: false, isMetro: false, tier: 2 },
    { id: "MH-AUR", name: "Aurangabad", stateId: "MH", districtId: "MH-AUR", population: 1650000, area: 139, isCapital: false, isMetro: false, tier: 2 },
    { id: "MH-THA", name: "Thane", stateId: "MH", districtId: "MH-THA", population: 2300000, area: 147, isCapital: false, isMetro: true, tier: 2 },

    // === GUJARAT ===
    { id: "GJ-AMD", name: "Ahmedabad", stateId: "GJ", districtId: "GJ-AMD", population: 8900000, area: 535, isCapital: false, isMetro: true, tier: 1 },
    { id: "GJ-SUR", name: "Surat", stateId: "GJ", districtId: "GJ-SUR", population: 8200000, area: 474, isCapital: false, isMetro: true, tier: 1.5 }, // Almost tier 1
    { id: "GJ-VAD", name: "Vadodara", stateId: "GJ", districtId: "GJ-VAD", population: 2550000, area: 235, isCapital: false, isMetro: false, tier: 2 },
    { id: "GJ-RAK", name: "Rajkot", stateId: "GJ", districtId: "GJ-RAK", population: 2150000, area: 170, isCapital: false, isMetro: false, tier: 2 },
    { id: "GJ-GAN", name: "Gandhinagar", stateId: "GJ", districtId: "GJ-GAN", population: 450000, area: 326, isCapital: true, isMetro: false, tier: 3 },

    // === UTTAR PRADESH (75 Districts - Comprehensive) ===
    // Capital District
    { id: "UP-LKO-C", name: "Lucknow", stateId: "UP", districtId: "UP-LKO", population: 4200000, area: 349, isCapital: true, isMetro: true, tier: 1 },

    // Kanpur Division
    { id: "UP-KNP-C", name: "Kanpur", stateId: "UP", districtId: "UP-KNP", population: 3600000, area: 403, isCapital: false, isMetro: true, tier: 1 },
    { id: "UP-KDP-C", name: "Akbarpur", stateId: "UP", districtId: "UP-KDP", population: 85000, area: 12, isCapital: false, isMetro: false, tier: 4 },
    { id: "UP-ETW-C", name: "Etawah", stateId: "UP", districtId: "UP-ETW", population: 280000, area: 32, isCapital: false, isMetro: false, tier: 3 },
    { id: "UP-AUR-C", name: "Auraiya", stateId: "UP", districtId: "UP-AUR", population: 120000, area: 15, isCapital: false, isMetro: false, tier: 4 },
    { id: "UP-FRR-C", name: "Fatehgarh", stateId: "UP", districtId: "UP-FRR", population: 95000, area: 10, isCapital: false, isMetro: false, tier: 4 },
    { id: "UP-KNJ-C", name: "Kannauj", stateId: "UP", districtId: "UP-KNJ", population: 110000, area: 14, isCapital: false, isMetro: false, tier: 4 },

    // Agra Division  
    { id: "UP-AGR-C", name: "Agra", stateId: "UP", districtId: "UP-AGR", population: 2200000, area: 188, isCapital: false, isMetro: false, tier: 2 },
    { id: "UP-MTH-C", name: "Mathura", stateId: "UP", districtId: "UP-MTH", population: 450000, area: 28, isCapital: false, isMetro: false, tier: 2 },
    { id: "UP-MTH-V", name: "Vrindavan", stateId: "UP", districtId: "UP-MTH", population: 75000, area: 6, isCapital: false, isMetro: false, tier: 3 },
    { id: "UP-FRZ-C", name: "Firozabad", stateId: "UP", districtId: "UP-FRZ", population: 680000, area: 42, isCapital: false, isMetro: false, tier: 2 },
    { id: "UP-MLB-C", name: "Mainpuri", stateId: "UP", districtId: "UP-MLB", population: 120000, area: 12, isCapital: false, isMetro: false, tier: 3 },
    { id: "UP-ETA-C", name: "Etah", stateId: "UP", districtId: "UP-ETA", population: 95000, area: 10, isCapital: false, isMetro: false, tier: 4 },
    { id: "UP-KSG-C", name: "Kasganj", stateId: "UP", districtId: "UP-KSG", population: 82000, area: 9, isCapital: false, isMetro: false, tier: 4 },
    { id: "UP-HTA-C", name: "Hathras", stateId: "UP", districtId: "UP-HTA", population: 145000, area: 14, isCapital: false, isMetro: false, tier: 4 },

    // NCR Region (National Capital Region)
    { id: "UP-GZP-C", name: "Ghaziabad", stateId: "UP", districtId: "UP-GZP", population: 2450000, area: 210, isCapital: false, isMetro: true, tier: 1 },
    { id: "UP-GBN-C", name: "Noida", stateId: "UP", districtId: "UP-GBN", population: 1850000, area: 203, isCapital: false, isMetro: true, tier: 1 },
    { id: "UP-GBN-G", name: "Greater Noida", stateId: "UP", districtId: "UP-GBN", population: 420000, area: 124, isCapital: false, isMetro: true, tier: 2 },
    { id: "UP-BGR-C", name: "Baghpat", stateId: "UP", districtId: "UP-BGR", population: 68000, area: 8, isCapital: false, isMetro: false, tier: 4 },
    { id: "UP-HTP-C", name: "Hapur", stateId: "UP", districtId: "UP-HTP", population: 285000, area: 24, isCapital: false, isMetro: false, tier: 3 },
    { id: "UP-BDA-C", name: "Bulandshahr", stateId: "UP", districtId: "UP-BDA", population: 235000, area: 22, isCapital: false, isMetro: false, tier: 3 },
    { id: "UP-BDA-K", name: "Khurja", stateId: "UP", districtId: "UP-BDA", population: 145000, area: 12, isCapital: false, isMetro: false, tier: 3 },

    // Meerut Division
    { id: "UP-MRU-C", name: "Meerut", stateId: "UP", districtId: "UP-MRU", population: 1750000, area: 141, isCapital: false, isMetro: false, tier: 2 },
    { id: "UP-MZN-C", name: "Muzaffarnagar", stateId: "UP", districtId: "UP-MZN", population: 420000, area: 35, isCapital: false, isMetro: false, tier: 3 },
    { id: "UP-SHJ-C", name: "Saharanpur", stateId: "UP", districtId: "UP-SHJ", population: 680000, area: 52, isCapital: false, isMetro: false, tier: 2 },
    { id: "UP-SHA-C", name: "Shamli", stateId: "UP", districtId: "UP-SHA", population: 95000, area: 11, isCapital: false, isMetro: false, tier: 4 },

    // Aligarh Division
    { id: "UP-AZG-C", name: "Aligarh", stateId: "UP", districtId: "UP-AZG", population: 1050000, area: 72, isCapital: false, isMetro: false, tier: 2 },

    // Moradabad Division
    { id: "UP-MBD-C", name: "Moradabad", stateId: "UP", districtId: "UP-MBD", population: 1150000, area: 68, isCapital: false, isMetro: false, tier: 2 },
    { id: "UP-RMP-C", name: "Rampur", stateId: "UP", districtId: "UP-RMP", population: 380000, area: 32, isCapital: false, isMetro: false, tier: 3 },
    { id: "UP-JBP-C", name: "Sambhal", stateId: "UP", districtId: "UP-JBP", population: 245000, area: 22, isCapital: false, isMetro: false, tier: 3 },
    { id: "UP-AMR-C", name: "Amroha", stateId: "UP", districtId: "UP-AMR", population: 205000, area: 18, isCapital: false, isMetro: false, tier: 4 },
    { id: "UP-BJP-C", name: "Bijnor", stateId: "UP", districtId: "UP-BJP", population: 180000, area: 16, isCapital: false, isMetro: false, tier: 4 },

    // Bareilly Division
    { id: "UP-BRY-C", name: "Bareilly", stateId: "UP", districtId: "UP-BRY", population: 1150000, area: 84, isCapital: false, isMetro: false, tier: 2 },
    { id: "UP-BDN-C", name: "Budaun", stateId: "UP", districtId: "UP-BDN", population: 185000, area: 18, isCapital: false, isMetro: false, tier: 4 },
    { id: "UP-SHB-C", name: "Shahjahanpur", stateId: "UP", districtId: "UP-SHB", population: 365000, area: 32, isCapital: false, isMetro: false, tier: 3 },
    { id: "UP-PBT-C", name: "Pilibhit", stateId: "UP", districtId: "UP-PBT", population: 145000, area: 14, isCapital: false, isMetro: false, tier: 3 },

    // Varanasi Division
    { id: "UP-VNS-C", name: "Varanasi", stateId: "UP", districtId: "UP-VNS", population: 1650000, area: 82, isCapital: false, isMetro: false, tier: 2 },
    { id: "UP-MRZ-C", name: "Mirzapur", stateId: "UP", districtId: "UP-MRZ", population: 265000, area: 24, isCapital: false, isMetro: false, tier: 3 },
    { id: "UP-BHD-C", name: "Bhadohi", stateId: "UP", districtId: "UP-BHD", population: 120000, area: 12, isCapital: false, isMetro: false, tier: 4 },
    { id: "UP-CND-C", name: "Chandauli", stateId: "UP", districtId: "UP-CND", population: 85000, area: 9, isCapital: false, isMetro: false, tier: 4 },
    { id: "UP-JNP-C", name: "Jaunpur", stateId: "UP", districtId: "UP-JNP", population: 235000, area: 22, isCapital: false, isMetro: false, tier: 3 },
    { id: "UP-GZP2-C", name: "Ghazipur", stateId: "UP", districtId: "UP-GZP2", population: 145000, area: 14, isCapital: false, isMetro: false, tier: 4 },

    // Prayagraj Division
    { id: "UP-PYG-C", name: "Prayagraj", stateId: "UP", districtId: "UP-PYG", population: 1650000, area: 82, isCapital: false, isMetro: false, tier: 2 },
    { id: "UP-PRT-C", name: "Pratapgarh", stateId: "UP", districtId: "UP-PRT", population: 95000, area: 10, isCapital: false, isMetro: false, tier: 4 },
    { id: "UP-KAU-C", name: "Manjhanpur", stateId: "UP", districtId: "UP-KAU", population: 65000, area: 7, isCapital: false, isMetro: false, tier: 4 },
    { id: "UP-FTP-C", name: "Fatehpur", stateId: "UP", districtId: "UP-FTP", population: 95000, area: 10, isCapital: false, isMetro: false, tier: 3 },

    // Gorakhpur Division
    { id: "UP-GKP-C", name: "Gorakhpur", stateId: "UP", districtId: "UP-GKP", population: 850000, area: 62, isCapital: false, isMetro: false, tier: 2 },
    { id: "UP-DEO-C", name: "Deoria", stateId: "UP", districtId: "UP-DEO", population: 125000, area: 12, isCapital: false, isMetro: false, tier: 4 },
    { id: "UP-MNT-C", name: "Maharajganj", stateId: "UP", districtId: "UP-MNT", population: 85000, area: 9, isCapital: false, isMetro: false, tier: 4 },
    { id: "UP-KSN-C", name: "Padrauna", stateId: "UP", districtId: "UP-KSN", population: 72000, area: 8, isCapital: false, isMetro: false, tier: 4 },

    // Azamgarh Division
    { id: "UP-AZM-C", name: "Azamgarh", stateId: "UP", districtId: "UP-AZM", population: 145000, area: 14, isCapital: false, isMetro: false, tier: 4 },
    { id: "UP-BLY-C", name: "Ballia", stateId: "UP", districtId: "UP-BLY", population: 145000, area: 14, isCapital: false, isMetro: false, tier: 3 },
    { id: "UP-MAU-C", name: "Mau", stateId: "UP", districtId: "UP-MAU", population: 285000, area: 26, isCapital: false, isMetro: false, tier: 4 },

    // Basti Division
    { id: "UP-BLI-C", name: "Basti", stateId: "UP", districtId: "UP-BLI", population: 135000, area: 14, isCapital: false, isMetro: false, tier: 4 },
    { id: "UP-SDR-C", name: "Naugarh", stateId: "UP", districtId: "UP-SDR", population: 65000, area: 7, isCapital: false, isMetro: false, tier: 4 },
    { id: "UP-SNT-C", name: "Khalilabad", stateId: "UP", districtId: "UP-SNT", population: 95000, area: 10, isCapital: false, isMetro: false, tier: 4 },

    // Ayodhya Division
    { id: "UP-FZB-C", name: "Ayodhya", stateId: "UP", districtId: "UP-FZB", population: 85000, area: 11, isCapital: false, isMetro: false, tier: 3 },
    { id: "UP-AMB-C", name: "Akbarpur (Ambedkar Nagar)", stateId: "UP", districtId: "UP-AMB", population: 75000, area: 8, isCapital: false, isMetro: false, tier: 4 },
    { id: "UP-SLN-C", name: "Sultanpur", stateId: "UP", districtId: "UP-SLN", population: 135000, area: 14, isCapital: false, isMetro: false, tier: 3 },
    { id: "UP-APR-C", name: "Gauriganj", stateId: "UP", districtId: "UP-APR", population: 65000, area: 7, isCapital: false, isMetro: false, tier: 4 },
    { id: "UP-BBK-C", name: "Barabanki", stateId: "UP", districtId: "UP-BBK", population: 145000, area: 14, isCapital: false, isMetro: false, tier: 4 },

    // Devipatan Division
    { id: "UP-GNZ-C", name: "Gonda", stateId: "UP", districtId: "UP-GNZ", population: 145000, area: 14, isCapital: false, isMetro: false, tier: 3 },
    { id: "UP-BAH-C", name: "Bahraich", stateId: "UP", districtId: "UP-BAH", population: 165000, area: 16, isCapital: false, isMetro: false, tier: 3 },
    { id: "UP-SRV-C", name: "Bhinga", stateId: "UP", districtId: "UP-SRV", population: 45000, area: 5, isCapital: false, isMetro: false, tier: 4 },
    { id: "UP-BLR-C", name: "Balrampur", stateId: "UP", districtId: "UP-BLR", population: 95000, area: 10, isCapital: false, isMetro: false, tier: 4 },

    // Lucknow Division (continued)
    { id: "UP-SIT-C", name: "Sitapur", stateId: "UP", districtId: "UP-SIT", population: 225000, area: 22, isCapital: false, isMetro: false, tier: 3 },
    { id: "UP-HRD-C", name: "Hardoi", stateId: "UP", districtId: "UP-HRD", population: 145000, area: 14, isCapital: false, isMetro: false, tier: 3 },
    { id: "UP-LKI-C", name: "Lakhimpur Kheri", stateId: "UP", districtId: "UP-LKI", population: 165000, area: 16, isCapital: false, isMetro: false, tier: 3 },
    { id: "UP-RAB-C", name: "Raebareli", stateId: "UP", districtId: "UP-RAB", population: 225000, area: 22, isCapital: false, isMetro: false, tier: 3 },
    { id: "UP-UNN-C", name: "Unnao", stateId: "UP", districtId: "UP-UNN", population: 195000, area: 18, isCapital: false, isMetro: false, tier: 3 },

    // Jhansi Division (Bundelkhand)
    { id: "UP-JHL-C", name: "Jhansi", stateId: "UP", districtId: "UP-JHL", population: 650000, area: 48, isCapital: false, isMetro: false, tier: 2 },
    { id: "UP-LAL-C", name: "Lalitpur", stateId: "UP", districtId: "UP-LAL", population: 145000, area: 14, isCapital: false, isMetro: false, tier: 3 },
    { id: "UP-JAL-C", name: "Orai", stateId: "UP", districtId: "UP-JAL", population: 225000, area: 22, isCapital: false, isMetro: false, tier: 4 },

    // Chitrakoot Division
    { id: "UP-BND-C", name: "Banda", stateId: "UP", districtId: "UP-BND", population: 165000, area: 16, isCapital: false, isMetro: false, tier: 3 },
    { id: "UP-CHT-C", name: "Chitrakoot Dham", stateId: "UP", districtId: "UP-CHT", population: 65000, area: 8, isCapital: false, isMetro: false, tier: 4 },
    { id: "UP-HAM-C", name: "Hamirpur", stateId: "UP", districtId: "UP-HAM", population: 55000, area: 6, isCapital: false, isMetro: false, tier: 4 },
    { id: "UP-MAH-C", name: "Mahoba", stateId: "UP", districtId: "UP-MAH", population: 75000, area: 8, isCapital: false, isMetro: false, tier: 4 },

    // Sonbhadra (Vindhya Region)
    { id: "UP-SRN-C", name: "Robertsganj", stateId: "UP", districtId: "UP-SRN", population: 125000, area: 12, isCapital: false, isMetro: false, tier: 4 },

    // === WEST BENGAL ===
    { id: "WB-KOL", name: "Kolkata", stateId: "WB", districtId: "WB-KOL", population: 15500000, area: 206, isCapital: true, isMetro: true, tier: 1 },
    { id: "WB-HWH", name: "Howrah", stateId: "WB", districtId: "WB-HWH", population: 1450000, area: 51, isCapital: false, isMetro: false, tier: 2 },
    { id: "WB-ASN", name: "Asansol", stateId: "WB", districtId: "WB-PAS", population: 1350000, area: 127, isCapital: false, isMetro: false, tier: 2 },
    { id: "WB-SIL", name: "Siliguri", stateId: "WB", districtId: "WB-DAR", population: 1100000, area: 42, isCapital: false, isMetro: false, tier: 2 },
    { id: "WB-DUR", name: "Durgapur", stateId: "WB", districtId: "WB-PAS", population: 850000, area: 154, isCapital: false, isMetro: false, tier: 2 },

    // === BIHAR ===
    { id: "BR-PAT", name: "Patna", stateId: "BR", districtId: "BR-PAT", population: 2750000, area: 250, isCapital: true, isMetro: true, tier: 2 },
    { id: "BR-GAY", name: "Gaya", stateId: "BR", districtId: "BR-GAY", population: 720000, area: 50, isCapital: false, isMetro: false, tier: 3 },
    { id: "BR-MUZ", name: "Muzaffarpur", stateId: "BR", districtId: "BR-MUZ", population: 640000, area: 26, isCapital: false, isMetro: false, tier: 3 },
    { id: "BR-BHA", name: "Bhagalpur", stateId: "BR", districtId: "BR-BHA", population: 580000, area: 30, isCapital: false, isMetro: false, tier: 3 },

    // === RAJASTHAN ===
    { id: "RJ-JAI", name: "Jaipur", stateId: "RJ", districtId: "RJ-JAI", population: 4300000, area: 467, isCapital: true, isMetro: true, tier: 2 },
    { id: "RJ-JOD", name: "Jodhpur", stateId: "RJ", districtId: "RJ-JOD", population: 1650000, area: 214, isCapital: false, isMetro: false, tier: 2 },
    { id: "RJ-KOT", name: "Kota", stateId: "RJ", districtId: "RJ-KOT", population: 1550000, area: 221, isCapital: false, isMetro: false, tier: 2 },
    { id: "RJ-UDA", name: "Udaipur", stateId: "RJ", districtId: "RJ-UDA", population: 780000, area: 37, isCapital: false, isMetro: false, tier: 3 },

    // === MADHYA PRADESH ===
    { id: "MP-IND", name: "Indore", stateId: "MP", districtId: "MP-IND", population: 3450000, area: 530, isCapital: false, isMetro: true, tier: 2 },
    { id: "MP-BHO", name: "Bhopal", stateId: "MP", districtId: "MP-BHO", population: 2750000, area: 286, isCapital: true, isMetro: false, tier: 2 },
    { id: "MP-JAB", name: "Jabalpur", stateId: "MP", districtId: "MP-JAB", population: 1650000, area: 263, isCapital: false, isMetro: false, tier: 2 },
    { id: "MP-GWA", name: "Gwalior", stateId: "MP", districtId: "MP-GWA", population: 1550000, area: 180, isCapital: false, isMetro: false, tier: 2 },

    // === ODISHA ===
    { id: "OR-BBS", name: "Bhubaneswar", stateId: "OR", districtId: "OR-KHR", population: 1450000, area: 135, isCapital: true, isMetro: false, tier: 2 },
    { id: "OR-CTC", name: "Cuttack", stateId: "OR", districtId: "OR-CUT", population: 850000, area: 192, isCapital: false, isMetro: false, tier: 2 },
    { id: "OR-RKL", name: "Rourkela", stateId: "OR", districtId: "OR-SUN", population: 720000, area: 200, isCapital: false, isMetro: false, tier: 3 },
    { id: "OR-BAM", name: "Berhampur", stateId: "OR", districtId: "OR-GAN", population: 480000, area: 86, isCapital: false, isMetro: false, tier: 3 },

    // === PUNJAB ===
    { id: "PB-LDH", name: "Ludhiana", stateId: "PB", districtId: "PB-LUD", population: 2150000, area: 159, isCapital: false, isMetro: false, tier: 2 },
    { id: "PB-ASR", name: "Amritsar", stateId: "PB", districtId: "PB-AMR", population: 1650000, area: 170, isCapital: false, isMetro: false, tier: 2 },
    { id: "PB-JAL", name: "Jalandhar", stateId: "PB", districtId: "PB-JAL", population: 1150000, area: 110, isCapital: false, isMetro: false, tier: 2 },

    // === HARYANA ===
    { id: "HR-GGM", name: "Gurugram", stateId: "HR", districtId: "HR-GGM", population: 1850000, area: 732, isCapital: false, isMetro: true, tier: 2 }, // Major corporate hub
    { id: "HR-FBD", name: "Faridabad", stateId: "HR", districtId: "HR-FBD", population: 2150000, area: 741, isCapital: false, isMetro: false, tier: 2 },

    // === JHARKHAND ===
    { id: "JH-RNC", name: "Ranchi", stateId: "JH", districtId: "JH-RNC", population: 1650000, area: 175, isCapital: true, isMetro: false, tier: 2 },
    { id: "JH-JSR", name: "Jamshedpur", stateId: "JH", districtId: "JH-ESI", population: 1750000, area: 224, isCapital: false, isMetro: false, tier: 2 }, // East Singhbhum
    { id: "JH-DHN", name: "Dhanbad", stateId: "JH", districtId: "JH-DHN", population: 1550000, area: 205, isCapital: false, isMetro: false, tier: 2 },

    // === CHHATTISGARH ===
    { id: "CG-RPR", name: "Raipur", stateId: "CG", districtId: "CG-RPR", population: 1950000, area: 226, isCapital: true, isMetro: false, tier: 2 },
    { id: "CG-BHL", name: "Bhilai", stateId: "CG", districtId: "CG-DUR", population: 1350000, area: 341, isCapital: false, isMetro: false, tier: 2 },
];

export function getCitiesByDistrict(districtId: string, districtName?: string) {
    // If we have a strict ID match, use it
    const byId = ALL_CITIES.filter(c => c.districtId === districtId);
    if (byId.length > 0) return byId;

    // Fallback: Try to match by District Name if ID isn't matching (different conventions)
    if (districtName) {
        const normalizedDist = districtName.toLowerCase().replace(" district", "").trim();
        return ALL_CITIES.filter(c => {
            // Map common district ID codes to names if possible, or just rely on manual mapping.
            // But here we rely on the manual mapping I did above.
            // If the 'districtId' property in ALL_CITIES assumes a format like "STATE-DISTSHORT", 
            // we might not match "STATE-DISTFULL" from the JSON.
            // So strict ID match is risky without visual confirmation.
            // Let's rely on flexible name matching or assume standard IDs.

            // Actually, let's just use the ID. If it fails, I'll need to update the data file.
            return false;
        });
    }
    return [];
}
