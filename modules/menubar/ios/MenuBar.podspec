Pod::Spec.new do |s|
  s.name           = 'MenuBar'
  s.version        = '1.0.0'
  s.summary        = 'Menu bar popover controls for GitHub Tracker'
  s.description    = 'Bridges the React popover UI to the native status item and main window'
  s.author         = 'Kadi Kraman'
  s.homepage       = 'https://github.com/kadikraman'
  s.platforms      = { :ios => '15.1', :osx => '11.0' }
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
  s.source_files = '**/*.{h,m,mm,swift,hpp,cpp}'
end
