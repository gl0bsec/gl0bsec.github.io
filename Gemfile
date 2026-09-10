source "https://rubygems.org"

# Jekyll 4.3.x is the newest line that still supports the macOS system Ruby (2.6),
# so a local preview works without installing a Ruby manager first.
gem "jekyll", "~> 4.3.4"

group :jekyll_plugins do
  gem "jekyll-feed",    "~> 0.17"
  gem "jekyll-seo-tag", "~> 2.8"
  gem "jekyll-sitemap", "~> 1.4"
end

# `jekyll serve` needs an explicit web server on Ruby >= 3.0.
gem "webrick", "~> 1.8"

if Gem::Version.new(RUBY_VERSION) < Gem::Version.new("3.0")
  # Recent ffi and sass-converter releases dropped Ruby 2.x. Hold them back so
  # the old macOS system Ruby can still build the site locally.
  gem "ffi", "< 1.17"
  gem "jekyll-sass-converter", "~> 2.2"
else
  group :test do
    # Link/markup checking in CI, which always runs a modern Ruby.
    gem "html-proofer", "~> 5.0"
  end
end
