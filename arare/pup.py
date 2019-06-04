from pegpy.tpeg import grammar, generate, STDLOG

# 文法を直したいときは
# pegpy/grammar/puppy.tpeg を編集する

peg = grammar('puppy.tpeg')
parser = generate(peg)

t = parser('''
if a > 0:
  print("さかね")
''')

STDLOG.dump(t)

# print(t.tag)
# for label, subtree in t:
#   print(label, subtree)


# def Source(t):
#   s = ''
#   for lb, st in t:
#     s += conv(st)
#   return s


# def IfStmt(t):
#   s = 'if ('
#   s += conv(s.cond)
#   s += ') {'
#   pass
#   return s


# func = globals()


# def conv(t):
#   if t.tag in func:
#     func[t.tag](t)
