function doPost(e) {
  var input = e.parameter.phone;
  var phones = [];

  if (!input) {
    phones = [];
  } else if (typeof input === 'string') {
    try {
      phones = JSON.parse(input);
      if (!Array.isArray(phones)) phones = [phones];
    } catch {
      phones = [input];
    }
  } else if (Array.isArray(input)) {
    phones = input;
  } else {
    phones = [input.toString()];
  }

  // Get cached phones, fallback to properties, else fetch fresh
  var existingPhones = getCachedPhones();

  var results = [];

  phones.forEach(function(phone) {
    if (!phone) {
      results.push({phone: phone, status: "invalid"});
      return;
    }

    var normalizedPhone = normalizePhoneSimple(phone);

    if (!existingPhones.has(normalizedPhone)) {
      People.People.createContact({
        names: [{ givenName: getDynamicName() }],
        phoneNumbers: [{ value: phone }]
      });
      existingPhones.add(normalizedPhone);
      updateStoredPhones(existingPhones);  // update both cache & properties
      results.push({phone: phone, status: "added"});
    } else {
      results.push({phone: phone, status: "exists"});
    }
  });

  return ContentService
    .createTextOutput(JSON.stringify(results))
    .setMimeType(ContentService.MimeType.JSON);
}

// Get phones from CacheService or PropertiesService or People API
function getCachedPhones() {
  var cache = CacheService.getScriptCache();
  var cachedData = cache.get("normalizedPhones");
  if (cachedData) {
    return new Set(JSON.parse(cachedData));
  }

  var scriptProps = PropertiesService.getScriptProperties();
  var propData = scriptProps.getProperty("normalizedPhones");
  if (propData) {
    cache.put("normalizedPhones", propData, 21600);  // cache 6 hrs
    return new Set(JSON.parse(propData));
  }

  // Fetch fresh from People API
  var freshPhones = getAllNormalizedPhones();
  var jsonData = JSON.stringify(Array.from(freshPhones));

  scriptProps.setProperty("normalizedPhones", jsonData);
  cache.put("normalizedPhones", jsonData, 21600);

  return freshPhones;
}

// Update both cache and properties after adding new phone(s)
function updateStoredPhones(phoneSet) {
  var jsonData = JSON.stringify(Array.from(phoneSet));
  var cache = CacheService.getScriptCache();
  cache.put("normalizedPhones", jsonData, 21600);

  var scriptProps = PropertiesService.getScriptProperties();
  scriptProps.setProperty("normalizedPhones", jsonData);
}

// Fetch all contacts' phones normalized
function getAllNormalizedPhones() {
  var existingPhones = new Set();
  var pageToken;

  do {
    var response = People.People.Connections.list('people/me', {
      personFields: 'phoneNumbers',
      pageSize: 200,
      pageToken: pageToken
    });

    var connections = response.connections || [];

    connections.forEach(function(person) {
      if (person.phoneNumbers) {
        person.phoneNumbers.forEach(function(phoneObj) {
          var normalized = normalizePhoneSimple(phoneObj.value);
          if (normalized) {
            existingPhones.add(normalized);
          }
        });
      }
    });

    pageToken = response.nextPageToken;
  } while (pageToken);

  return existingPhones;
}

// Simple normalize (keep last 10 digits)
function normalizePhoneSimple(num) {
  if (!num) return null;
  var digits = num.toString().replace(/\D/g, '');
  if (digits.length > 10) digits = digits.slice(-10);
  return digits;
}

// Dynamic name with timestamp
function getDynamicName() {
  var now = new Date();
  var hh = now.getHours().toString().padStart(2, '0');
  var mm = now.getMinutes().toString().padStart(2, '0');
  var ss = now.getSeconds().toString().padStart(2, '0');

  
  return "ggAdded" + hh + mm + ss;
}
