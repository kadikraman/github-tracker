Pod::Spec.new do |s|
  s.name           = 'Updater'
  s.version        = '1.0.0'
  s.summary        = 'Sparkle auto-updates for GitHub Tracker'
  s.description    = 'Bridges Sparkle 2 update state and actions to the React banner UI'
  s.author         = 'Kadi Kraman'
  s.homepage       = 'https://github.com/kadikraman'
  # macOS only: Sparkle has no iOS platform, so no :ios entry here.
  s.platforms      = { :osx => '11.0' }
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.dependency 'Sparkle', '~> 2.9'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
  s.source_files = '**/*.{h,m,mm,swift,hpp,cpp}'
end
