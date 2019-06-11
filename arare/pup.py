import sys
from pegpy.tpeg import grammar, generate, STDLOG

# 文法を直したいときは
# pegpy/grammar/puppy.tpeg を編集する

peg = grammar('puppy.tpeg')
parser = generate(peg)

source = '''
print("こんにちは、のぶちゃん")
'''


# print(t.tag)
# for label, subtree in t:
#   print(label, subtree)


def Source(t):
    s = ''
    for label, subtree in t:
        s += conv(subtree) + '\n'
    return s


def VarDecl(t):
    left = conv(t['left'])
    right = conv(t['right'])
    return '{} = {}'.format(left, right)


def Name(t):
    return t.asString()


def ApplyExpr(t):
    name = conv(t['name'])
    return name + '(TODO)'

def IfStmt(t):
    s = 'if ('
    s += conv(t['cond'])
    s += ')'
    s += conv(t['then'])
    return s


def Infix(t):
    s = conv(t['left']) + conv(t['name']) + conv(t['right'])
    return s


def Block(t):
    s = '{'
    for label, subtree in t:
        s += conv(subtree) + '\n'
    s += '}'
    return s

func = globals()


def conv(t):
    if t.tag in func:
        return func[t.tag](t)
    else:
        return str(t)


def transpile(s):
    t = parser(s)
    STDLOG.dump(t)  # debug
    return conv(t)

# main スクリプト


if __name__ == "__main__":
    if len(sys.argv) > 1:
        with open(sys.argv[1]) as f:
            source = f.read()
    code = transpile(source)
    print(code)
