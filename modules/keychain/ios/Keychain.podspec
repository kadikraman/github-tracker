Pod::Spec.new do |s|
  s.name           = 'Keychain'
  s.version        = '1.0.0'
  s.summary        = 'Keychain-backed secret storage for GitHub Tracker'
  s.description    = 'Stores small secrets in the system Keychain via Security.framework'
  s.author         = 'Kadi Kraman'
  s.homepage       = 'https://github.com/kadikraman'
  s.platforms      = { :ios => '15.1', :osx => '11.0' }
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
  s.source_files = '**/*.{h,m,mm,swift,hpp,cpp}'
end
