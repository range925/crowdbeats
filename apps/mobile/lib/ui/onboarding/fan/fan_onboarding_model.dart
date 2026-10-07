// Crowdbeats V2 — Fan Onboarding State Model (Stitch Authority 5326179813018056505)
// Zero fake autofill contract: all fields initialize blank/empty unless user-provided.

class FanOnboardingData {
  // Step 1: Basic Information
  String firstName = '';
  String lastName = '';
  String username = '';
  String email = '';
  String phone = '';
  String? avatarUrl;
  List<String> quickGenres = [];
  List<String> connectedSocials = [];

  // Step 2: Preferences & Artists
  List<String> favoriteGenres = [];
  List<String> discoveryChannels = [];
  List<String> favoriteArtists = [];
  bool notifyLiveShows = false;
  bool notifyCampaigns = false;
  bool notifyTipsActivity = false;
  bool notifySpecialOffers = false;

  // Step 3: Details & Experience
  String bio = '';
  String city = '';
  String birthDate = '';
  String occupation = '';
  String pronouns = '';
  List<String> interests = [];
  String showFrequency = '';
  List<String> platformPriorities = [];
  String profileVisibility = 'Public';

  Map<String, dynamic> toProfileData() {
    return {
      'firstName': firstName.trim(),
      'lastName': lastName.trim(),
      'username': username.trim().toLowerCase(),
      'email': email.trim(),
      'phone': phone.trim(),
      'avatarUrl': avatarUrl,
      'bio': bio.trim(),
      'city': city,
      'birthDate': birthDate,
      'occupation': occupation.trim(),
      'pronouns': pronouns,
      'favoriteGenres': favoriteGenres,
      'discoveryChannels': discoveryChannels,
      'favoriteArtists': favoriteArtists,
      'interests': interests,
      'showFrequency': showFrequency,
      'platformPriorities': platformPriorities,
      'profileVisibility': profileVisibility,
      'notifications': {
        'liveShows': notifyLiveShows,
        'campaigns': notifyCampaigns,
        'tipsActivity': notifyTipsActivity,
        'specialOffers': notifySpecialOffers,
      },
    };
  }
}
