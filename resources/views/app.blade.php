<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="creative-user" content='@json($authUser)'>
    <title>{{ config('app.name', 'FF Creative Hub') }}</title>
    <link rel="stylesheet" href="{{ asset('css/app.css') }}">
  </head>
  <body>
    <div id="app"></div>
    <div id="modal-root" aria-live="polite"></div>
    <form id="logout-form" method="post" action="{{ route('logout') }}" hidden>
      @csrf
    </form>
    <script src="{{ asset('js/app.js') }}"></script>
  </body>
</html>
